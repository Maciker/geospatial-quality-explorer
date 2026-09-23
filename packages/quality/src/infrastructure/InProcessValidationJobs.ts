import { randomUUID } from "node:crypto";
import { DomainError } from "../domain/DomainError.js";
import type { ValidationRunRepository } from "../domain/ValidationRunRepository.js";
import type { GeometryEngine } from "../domain/GeometryEngine.js";
import type { DatasetDeclaration } from "../application/parseFeatureCollection.js";
import type { Digest } from "../application/validateDataset.js";
import { validateDataset } from "../application/validateDataset.js";
import type { ValidationJob } from "../application/ValidationJob.js";

type MutableJob = {
  jobId: string;
  status: ValidationJob["status"];
  runId: string | null;
  message: string | null;
  cancelRequested: boolean;
};

export class InProcessValidationJobs {
  private readonly jobs = new Map<string, MutableJob>();

  constructor(
    private readonly repository: ValidationRunRepository,
    private readonly engine: GeometryEngine,
    private readonly digest: Digest,
    private readonly clock: () => Date,
    private readonly beforePersist: (() => Promise<void>) | null = null,
  ) {}

  submit(input: { readonly declaration: DatasetDeclaration; readonly collection: unknown; readonly sourceBytes: Uint8Array }): ValidationJob {
    const job: MutableJob = {
      jobId: randomUUID(),
      status: "pending",
      runId: null,
      message: null,
      cancelRequested: false,
    };
    this.jobs.set(job.jobId, job);
    queueMicrotask(() => {
      void this.execute(job, input);
    });
    return snapshot(job);
  }

  get(jobId: string): ValidationJob | null {
    const job = this.jobs.get(jobId);
    return job ? snapshot(job) : null;
  }

  cancel(jobId: string): ValidationJob {
    const job = this.jobs.get(jobId);
    if (!job) throw DomainError.createNotFound(`unknown job ${jobId}`);
    if (job.status !== "pending" && job.status !== "running") {
      throw DomainError.createValidation("Only a pending or running import can be cancelled.");
    }
    job.cancelRequested = true;
    if (job.status === "pending") job.status = "cancelled";
    return snapshot(job);
  }

  private async execute(
    job: MutableJob,
    input: { readonly declaration: DatasetDeclaration; readonly collection: unknown; readonly sourceBytes: Uint8Array },
  ): Promise<void> {
    if (job.cancelRequested) {
      job.status = "cancelled";
      return;
    }
    job.status = "running";
    try {
      const startedAt = this.clock();
      const run = validateDataset({
        collection: input.collection,
        sourceBytes: input.sourceBytes,
        declaration: input.declaration,
        digest: this.digest,
        engine: this.engine,
        startedAt,
        completedAt: this.clock(),
      });
      if (this.beforePersist) await this.beforePersist();
      if (job.cancelRequested) {
        job.status = "cancelled";
        job.message = "Cancelled before the run was stored.";
        return;
      }
      await this.repository.save(run);
      job.status = "succeeded";
      job.runId = run.runId;
    } catch (error) {
      job.status = "failed";
      job.message = error instanceof Error ? error.message : "Import failed.";
    }
  }
}

function snapshot(job: MutableJob): ValidationJob {
  return { jobId: job.jobId, status: job.status, runId: job.runId, message: job.message };
}
