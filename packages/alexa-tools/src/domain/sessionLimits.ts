import { DATASET_LIMITS } from "../../../quality/src/domain/limits.js";

export const ALEXA_TOOL_LIMITS = {
  maxRunsPerSession: 8,
  maxSessions: 64,
  sessionTtlMs: 30 * 60 * 1000,
  maxPageSize: DATASET_LIMITS.maxPageSize,
  defaultPageSize: DATASET_LIMITS.defaultPageSize,
  maxBytes: DATASET_LIMITS.maxBytes,
  sessionIdPattern: /^[a-zA-Z0-9_-]{8,128}$/,
  runIdPattern: /^[a-f0-9]{64}$/,
  fixtureIdPattern: /^[a-z0-9-]+$/,
} as const;
