export type ValidationJobStatus = "pending" | "running" | "succeeded" | "failed" | "cancelled";

export type ValidationJob = {
  readonly jobId: string;
  readonly status: ValidationJobStatus;
  readonly runId: string | null;
  readonly message: string | null;
};
