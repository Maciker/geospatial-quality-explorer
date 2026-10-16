import { describe, expect, it } from "vitest";
import { splitBreakableId } from "./formatBreakableId";

describe("splitBreakableId", () => {
  it("splits after colon and hyphen separators so the parts rejoin to the exact id", () => {
    const id = "run:abc-def:geometry.invalid";
    const parts = splitBreakableId(id);
    expect(parts).toEqual(["run:", "abc-", "def:", "geometry.invalid"]);
    expect(parts.join("")).toBe(id);
  });

  it("never adds characters, so copied text matches the real id", () => {
    expect(splitBreakableId("a".repeat(64) + ":16:geometry.invalid").join("")).not.toContain("​");
  });

  it("leaves short tokens without separators as one part", () => {
    expect(splitBreakableId("PRT")).toEqual(["PRT"]);
  });
});
