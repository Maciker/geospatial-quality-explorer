import { DomainError } from "./DomainError.js";
import type { ValidationRun } from "./geometry.js";
import type { Maybe } from "./Maybe.js";

type StoredRunIdentity = {
  readonly status: ValidationRun["status"];
  readonly sourceHash: string;
};

type SaveDecision = "insert" | "keep" | "replace";

export function decideSave(existing: StoredRunIdentity | null, incoming: StoredRunIdentity): SaveDecision {
  if (existing === null) return "insert";
  if (existing.status === "succeeded") {
    if (incoming.status !== "succeeded" || incoming.sourceHash !== existing.sourceHash) {
      throw DomainError.createValidation("A completed run is immutable and cannot be replaced.");
    }
    return "keep";
  }
  return "replace";
}

export interface ValidationRunRepository {
  save(run: ValidationRun): Promise<void>;
  findById(runId: string): Promise<Maybe<ValidationRun>>;
}
