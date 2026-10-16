import { describe, expect, it, vi } from "vitest";
import { copyFindingId, errorAfterCopy } from "./copyFindingId";

describe("copyFindingId", () => {
  it("writes the exact id and reports copied", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await expect(copyFindingId({ writeText }, "run:0:geometry.invalid")).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith("run:0:geometry.invalid");
  });

  it("reports unavailable when the browser has no clipboard", async () => {
    await expect(copyFindingId(undefined, "x")).resolves.toBe("unavailable");
  });

  it("reports failed when writeText rejects or throws", async () => {
    await expect(copyFindingId({ writeText: () => Promise.reject(new Error("denied")) }, "x")).resolves.toBe("failed");
    await expect(copyFindingId({ writeText: () => { throw new Error("denied"); } }, "x")).resolves.toBe("failed");
  });

  it("shows a specific error for a missing or failed clipboard", () => {
    expect(errorAfterCopy("unavailable", null)).toBe("Clipboard is not available in this browser.");
    expect(errorAfterCopy("failed", "Some other error")).toBe("Could not copy findingId.");
  });

  it("clears only a previous copy error after a successful copy", () => {
    expect(errorAfterCopy("copied", "Could not copy findingId.")).toBeNull();
    expect(errorAfterCopy("copied", "Clipboard is not available in this browser.")).toBeNull();
    expect(errorAfterCopy("copied", "The model timed out.")).toBe("The model timed out.");
    expect(errorAfterCopy("copied", null)).toBeNull();
  });
});
