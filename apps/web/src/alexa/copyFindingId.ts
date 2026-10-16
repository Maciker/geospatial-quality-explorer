type CopyResult = "copied" | "unavailable" | "failed";

/** Copies the id verbatim; the caller decides how to tell the user. */
export async function copyFindingId(
  clipboard: { writeText(text: string): Promise<void> } | undefined,
  findingId: string,
): Promise<CopyResult> {
  if (!clipboard) return "unavailable";
  try {
    await clipboard.writeText(findingId);
    return "copied";
  } catch {
    return "failed";
  }
}

const COPY_UNAVAILABLE = "Clipboard is not available in this browser.";
const COPY_FAILED = "Could not copy findingId.";

/** The error banner for a copy attempt; a success clears only a previous copy error, never another one. */
export function errorAfterCopy(result: CopyResult, currentError: string | null): string | null {
  if (result === "unavailable") return COPY_UNAVAILABLE;
  if (result === "failed") return COPY_FAILED;
  return currentError === COPY_UNAVAILABLE || currentError === COPY_FAILED ? null : currentError;
}
