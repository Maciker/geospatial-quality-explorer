import { describe, expect, it } from "vitest";
import {
  catalogFixtureFromValidateCommand,
  isRunScopedIntent,
  lastUserContent,
} from "../src/application/sessionRecovery.js";

describe("sessionRecovery helpers", () => {
  it("extracts catalog fixture ids from validate commands", () => {
    expect(catalogFixtureFromValidateCommand("Validate the portfolio fixture.")).toBe("portfolio");
    expect(catalogFixtureFromValidateCommand("Validate the ne-admin0-westeurope fixture.")).toBe("ne-admin0-westeurope");
    expect(catalogFixtureFromValidateCommand("Validate ne-admin0-westeurope-demo-errors.")).toBe(
      "ne-admin0-westeurope-demo-errors",
    );
    expect(catalogFixtureFromValidateCommand("Please check the clean fixture")).toBe("clean");
    expect(catalogFixtureFromValidateCommand("List the findings.")).toBeNull();
    expect(catalogFixtureFromValidateCommand("Validate my private upload")).toBeNull();
    expect(catalogFixtureFromValidateCommand("Don't validate the portfolio.")).toBeNull();
    expect(catalogFixtureFromValidateCommand("Don't check the clean fixture.")).toBeNull();
  });

  it("detects run-scoped intents that need a validated run", () => {
    expect(isRunScopedIntent("List the findings.")).toBe(true);
    expect(isRunScopedIntent("Explain the next finding.")).toBe(true);
    expect(isRunScopedIntent("Export QGIS.")).toBe(true);
    expect(isRunScopedIntent("Validate the portfolio fixture.")).toBe(false);
    expect(isRunScopedIntent("Explain what a self-intersection is.")).toBe(false);
    expect(isRunScopedIntent("How does the export work?")).toBe(false);
    expect(isRunScopedIntent("Don't export yet.")).toBe(false);
  });

  it("reads the last user message content", () => {
    expect(
      lastUserContent([
        { role: "user", content: "first" },
        { role: "assistant", content: "ok" },
        { role: "user", content: "second" },
      ]),
    ).toBe("second");
  });
});
