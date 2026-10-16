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
