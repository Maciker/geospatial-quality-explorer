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

  it("chunks a 64-char hex run while keeping the rule token intact", () => {
    const hash = "a".repeat(64);
    const id = `${hash}:16:geometry.invalid`;
    const parts = splitBreakableId(id);
    expect(parts.join("")).toBe(id);
    expect(parts[0]).toBe("aaaaaaaa");
    expect(parts.filter((part) => /^a+$/.test(part.replace(/:$/, ""))).every((part) => part.replace(/:$/, "").length <= 8)).toBe(true);
    expect(parts.at(-1)).toBe("geometry.invalid");
  });
});
