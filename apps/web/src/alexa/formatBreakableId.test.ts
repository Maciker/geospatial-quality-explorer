import { describe, expect, it } from "vitest";
import { formatBreakableId } from "./formatBreakableId";

describe("formatBreakableId", () => {
  it("inserts zero-width spaces after colon and hyphen separators", () => {
    expect(formatBreakableId("run:abc-def:geometry.invalid")).toBe(
      "run:\u200babc-\u200bdef:\u200bgeometry.invalid",
    );
  });

  it("leaves short tokens without separators unchanged", () => {
    expect(formatBreakableId("PRT")).toBe("PRT");
  });
});
