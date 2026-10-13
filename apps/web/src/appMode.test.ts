import { describe, expect, it } from "vitest";
import { resolveAppMode } from "./appMode";

describe("resolveAppMode", () => {
  it("opens the run review by default and the simulation with ?sim=alexa", () => {
    expect(resolveAppMode("", undefined)).toEqual({ mode: "review", canSwitch: true });
    expect(resolveAppMode("?sim=alexa", undefined)).toEqual({ mode: "alexa", canSwitch: true });
  });

  it("serves only the simulation in an alexa-only build", () => {
    expect(resolveAppMode("?run=abc", "alexa-only")).toEqual({ mode: "alexa", canSwitch: false });
  });
});
