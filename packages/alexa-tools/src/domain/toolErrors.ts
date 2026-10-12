export const TOOL_ERROR_CODES = [
  "invalid_request",
  "not_found",
  "session_expired",
  "session_full",
  "limit_exceeded",
  "refused",
] as const;

export type ToolErrorCode = (typeof TOOL_ERROR_CODES)[number];

export type ToolErrorBody = {
  readonly ok: false;
  readonly sessionId: string;
  readonly error: ToolErrorCode;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
};

export type ToolSuccess<T> = {
  readonly ok: true;
  readonly sessionId: string;
  readonly data: T;
};

export type ToolResult<T> = ToolSuccess<T> | ToolErrorBody;

export function toolSuccess<T>(sessionId: string, data: T): ToolSuccess<T> {
  return { ok: true, sessionId, data };
}

export function toolError(
  sessionId: string,
  error: ToolErrorCode,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): ToolErrorBody {
  if (details === undefined) {
    return { ok: false, sessionId, error, message };
  }
  return { ok: false, sessionId, error, message, details };
}
