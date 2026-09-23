import type { ValidationRun } from "./geometry.js";
import { Maybe } from "./Maybe.js";
import { decideSave, type ValidationRunRepository } from "./ValidationRunRepository.js";

export class InMemoryValidationRunRepository implements ValidationRunRepository {
  private readonly runs = new Map<string, ValidationRun>();

  async save(run: ValidationRun): Promise<void> {
    const existing = this.runs.get(run.runId) ?? null;
    const decision = decideSave(
      existing === null ? null : { status: existing.status, sourceHash: existing.sourceHash },
      { status: run.status, sourceHash: run.sourceHash },
    );
    if (decision === "keep") return;
    this.runs.set(run.runId, structuredClone(run));
  }

  async findById(runId: string): Promise<Maybe<ValidationRun>> {
    return Maybe.fromNullable(this.runs.get(runId) ?? null);
  }
}
