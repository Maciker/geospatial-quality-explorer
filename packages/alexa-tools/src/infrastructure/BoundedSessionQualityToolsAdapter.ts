import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import {
  buildQgisBundle,
  PlanarPolygonEngine,
  Sha256Digest,
  validateDataset,
  type ValidationRun,
} from "../../../quality/src/index.js";
import { pagePrioritizedFindings, prioritizeFindings } from "../application/prioritizeFindings.js";
import type { QualityToolsPort } from "../application/QualityToolsPort.js";
import { ALEXA_TOOL_LIMITS } from "../domain/sessionLimits.js";
import type {
  ExplainFindingInput,
  ExplainFindingOutput,
  ExportQgisInput,
  ExportQgisOutput,
  FindingSummary,
  ListFindingsInput,
  ListFindingsOutput,
  ListFixturesInput,
  ListFixturesOutput,
  RunValidationInput,
  RunValidationOutput,
  SessionSnapshot,
} from "../domain/toolContracts.js";
import { toolError, toolSuccess, type ToolResult } from "../domain/toolErrors.js";
import { listFixtureCatalog, resolveFixturePath } from "./listFixtureCatalog.js";

const SNAPSHOT_FINDING_LIMIT = 20;

type SessionRecord = {
  readonly runs: Map<string, ValidationRun>;
  lastAccessAtMs: number;
};

export type BoundedSessionQualityToolsAdapterOptions = {
  readonly fixturesDirectory: string;
  readonly now?: () => number;
  readonly limits?: Partial<typeof ALEXA_TOOL_LIMITS>;
};

export class BoundedSessionQualityToolsAdapter implements QualityToolsPort {
  private readonly fixturesDirectory: string;
  private readonly now: () => number;
  private readonly limits: typeof ALEXA_TOOL_LIMITS;
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly engine = new PlanarPolygonEngine();
  private readonly digest = new Sha256Digest();
  private readonly fixtureIds: ReadonlySet<string>;

  constructor(options: BoundedSessionQualityToolsAdapterOptions) {
    this.fixturesDirectory = options.fixturesDirectory;
    this.now = options.now ?? (() => Date.now());
    this.limits = { ...ALEXA_TOOL_LIMITS, ...options.limits };
    this.fixtureIds = new Set(listFixtureCatalog(this.fixturesDirectory).map((fixture) => fixture.fixtureId));
  }

  async listFixtures(input: ListFixturesInput): Promise<ToolResult<ListFixturesOutput>> {
    const opened = this.openSession(input.sessionId);
    if (!opened.ok) return opened;
    return toolSuccess(opened.sessionId, { fixtures: listFixtureCatalog(this.fixturesDirectory) });
  }

  async runValidation(input: RunValidationInput): Promise<ToolResult<RunValidationOutput>> {
    const active = this.resolveActiveSession(
      input.sessionId,
      "This session expired. Start a new session with list_fixtures.",
    );
    if (!active.ok) return active;
    const { sessionId, session } = active.data;
    if (!this.limits.fixtureIdPattern.test(input.fixtureId) || !this.fixtureIds.has(input.fixtureId)) {
      return toolError(sessionId, "not_found", `Unknown fixture ${input.fixtureId}.`, { fixtureId: input.fixtureId });
    }
    if (session.runs.size >= this.limits.maxRunsPerSession) {
      return toolError(sessionId, "session_full", `Sessions are limited to ${this.limits.maxRunsPerSession} runs.`);
    }
    const path = resolveFixturePath(this.fixturesDirectory, input.fixtureId);
    const sourceBytes = readFileSync(path);
    if (sourceBytes.byteLength > this.limits.maxBytes) {
      return toolError(sessionId, "limit_exceeded", `Fixtures are limited to ${this.limits.maxBytes} bytes.`);
    }
    let collection: unknown;
    try {
      collection = JSON.parse(sourceBytes.toString("utf8")) as unknown;
    } catch {
      return toolError(sessionId, "invalid_request", "The fixture file is not valid JSON.");
    }
    const completedAt = new Date(this.now());
    const run = validateDataset({
      collection,
      sourceBytes,
      declaration: {
        name: input.fixtureId,
        sourceCrs: "EPSG:4326",
        license: "CC0-1.0",
        parameters: {},
      },
      digest: this.digest,
      engine: this.engine,
      startedAt: completedAt,
      completedAt,
    });
    // Re-insert so Map order tracks the most recent validation (describeSession reads the last entry).
    session.runs.delete(run.runId);
    session.runs.set(run.runId, run);
    return toolSuccess(sessionId, {
      runId: run.runId,
      datasetName: run.datasetName,
      sourceHash: run.sourceHash,
      findingCount: run.findings.length,
      status: run.status,
      limitations: run.limitations,
    });
  }

  async listFindings(input: ListFindingsInput): Promise<ToolResult<ListFindingsOutput>> {
    const runContext = this.resolveActiveRun(input.sessionId, input.runId);
    if (!runContext.ok) return runContext;
    const { sessionId, run } = runContext.data;
    const limit = this.parsePageLimit(input.limit);
    if (limit === null) {
      return toolError(
        sessionId,
        "limit_exceeded",
        `limit must be from 1 to ${this.limits.maxPageSize}.`,
      );
    }
    const cursor = input.cursor ?? null;
    const ordered = pagePrioritizedFindings(run.findings, limit, cursor);
    if (ordered.invalidCursor) {
      return toolError(sessionId, "invalid_request", "cursor does not match this result.", { cursor });
    }
    return toolSuccess(sessionId, {
      runId: run.runId,
      findings: ordered.findings.map(toFindingSummary),
      nextCursor: ordered.nextCursor,
    });
  }

  async explainFinding(input: ExplainFindingInput): Promise<ToolResult<ExplainFindingOutput>> {
    const active = this.resolveActiveSession(input.sessionId);
    if (!active.ok) return active;
    const { sessionId, session } = active.data;
    if (session.runs.size === 0) {
      return toolError(sessionId, "refused", "Run validation before asking for a finding explanation.");
    }
    if (input.findingId.trim().length === 0) {
      return toolError(sessionId, "invalid_request", "findingId is required.");
    }
    for (const [runId, run] of session.runs) {
      const match = run.findings.find((finding) => finding.findingId === input.findingId);
      if (match) {
        return toolSuccess(sessionId, { runId, finding: toFindingSummary(match) });
      }
    }
    return toolError(sessionId, "not_found", `Unknown finding ${input.findingId}.`, { findingId: input.findingId });
  }

  async exportQgis(input: ExportQgisInput): Promise<ToolResult<ExportQgisOutput>> {
    const runContext = this.resolveActiveRun(input.sessionId, input.runId);
    if (!runContext.ok) return runContext;
    const { sessionId, run } = runContext.data;
    const bundle = buildQgisBundle(run);
    return toolSuccess(sessionId, {
      runId: run.runId,
      files: {
        geojson: bundle.geojson,
        metadata: bundle.metadata,
        project: bundle.project,
        style: bundle.style,
      },
      limitations: run.limitations,
    });
  }

  async describeSession(sessionId: string): Promise<SessionSnapshot | null> {
    const session = this.sessions.get(sessionId);
    if (!session || this.now() - session.lastAccessAtMs > this.limits.sessionTtlMs) return null;
    const run = [...session.runs.values()].at(-1);
    if (!run) return null;
    return {
      sessionId,
      runId: run.runId,
      datasetName: run.datasetName,
      prioritizedFindingIds: prioritizeFindings(run.findings).slice(0, SNAPSHOT_FINDING_LIMIT).map((finding) => finding.findingId),
    };
  }

  private openSession(sessionId: string | undefined): ToolResult<{ readonly sessionId: string }> {
    this.evictExpiredSessions();
    if (sessionId !== undefined) {
      if (!this.limits.sessionIdPattern.test(sessionId)) {
        return toolError(sessionId, "invalid_request", "sessionId must match [a-zA-Z0-9_-]{8,128}.");
      }
      if (!this.sessions.has(sessionId)) {
        this.ensureSessionCapacity();
        this.sessions.set(sessionId, { runs: new Map(), lastAccessAtMs: this.now() });
      } else {
        this.touchSession(sessionId);
      }
      return toolSuccess(sessionId, { sessionId });
    }
    this.ensureSessionCapacity();
    const created = mintSessionId();
    this.sessions.set(created, { runs: new Map(), lastAccessAtMs: this.now() });
    return toolSuccess(created, { sessionId: created });
  }

  private requireSessionId(sessionId: string): ToolResult<{ readonly sessionId: string }> {
    if (!this.limits.sessionIdPattern.test(sessionId)) {
      return toolError(sessionId, "invalid_request", "sessionId must match [a-zA-Z0-9_-]{8,128}.");
    }
    return toolSuccess(sessionId, { sessionId });
  }

  private resolveActiveSession(
    sessionId: string,
    expiredMessage = "This session expired.",
  ): ToolResult<{ readonly sessionId: string; readonly session: SessionRecord }> {
    const sessionCheck = this.requireSessionId(sessionId);
    if (!sessionCheck.ok) return sessionCheck;
    const activeSessionId = sessionCheck.sessionId;
    const session = this.touchSession(activeSessionId);
    if (session === null) {
      return toolError(activeSessionId, "session_expired", expiredMessage);
    }
    return toolSuccess(activeSessionId, { sessionId: activeSessionId, session });
  }

  private resolveActiveRun(
    sessionId: string,
    runId: string,
  ): ToolResult<{ readonly sessionId: string; readonly run: ValidationRun }> {
    const active = this.resolveActiveSession(sessionId);
    if (!active.ok) return active;
    const { sessionId: activeSessionId, session } = active.data;
    const runLookup = this.resolveRun(activeSessionId, session, runId);
    if (!runLookup.ok) return runLookup;
    return toolSuccess(activeSessionId, { sessionId: activeSessionId, run: runLookup.data.run });
  }

  private resolveRun(
    sessionId: string,
    session: SessionRecord,
    runId: string,
  ): ToolResult<{ readonly run: ValidationRun }> {
    if (!this.limits.runIdPattern.test(runId)) {
      return toolError(sessionId, "invalid_request", "runId must be a 64 character hex digest.");
    }
    const run = session.runs.get(runId);
    if (!run) {
      return toolError(sessionId, "not_found", `Unknown run ${runId}.`, { runId });
    }
    return toolSuccess(sessionId, { run });
  }

  private touchSession(sessionId: string): SessionRecord | null {
    this.evictExpiredSessions();
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (this.now() - session.lastAccessAtMs > this.limits.sessionTtlMs) {
      this.sessions.delete(sessionId);
      return null;
    }
    session.lastAccessAtMs = this.now();
    return session;
  }

  private ensureSessionCapacity(): void {
    if (this.sessions.size < this.limits.maxSessions) return;
    const oldest = [...this.sessions.entries()].sort((left, right) => left[1].lastAccessAtMs - right[1].lastAccessAtMs)[0];
    if (oldest) this.sessions.delete(oldest[0]);
  }

  private evictExpiredSessions(): void {
    const cutoff = this.now() - this.limits.sessionTtlMs;
    for (const [sessionId, session] of this.sessions) {
      if (session.lastAccessAtMs < cutoff) this.sessions.delete(sessionId);
    }
  }

  private parsePageLimit(limit: number | undefined): number | null {
    if (limit === undefined) return this.limits.defaultPageSize;
    if (!Number.isInteger(limit) || limit < 1 || limit > this.limits.maxPageSize) return null;
    return limit;
  }
}

function mintSessionId(): string {
  return randomBytes(12).toString("base64url");
}

function toFindingSummary(finding: ValidationRun["findings"][number]): FindingSummary {
  return {
    findingId: finding.findingId,
    ruleId: finding.ruleId,
    severity: finding.severity,
    featureId: finding.featureId,
    explanation: finding.explanation,
    suggestedAction: finding.suggestedAction,
    geometry: finding.geometry,
  };
}
