import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readStyles(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

/** The first media query that limits the height: the condition under which the page height unlocks. */
function unlockQuery(css: string): string | null {
  const queries = [...css.matchAll(/@media ([^{]+)\{/g)].map((match) => match[1]!.trim());
  return queries.find((query) => query.includes("max-height")) ?? null;
}

describe("shell breakpoints", () => {
  it("unlocks the page height under the same media query in the shell and the panel", () => {
    const shell = unlockQuery(readStyles("./App.module.css"));
    expect(shell).not.toBeNull();
    expect(unlockQuery(readStyles("./alexa/AlexaSimPanel.module.css"))).toBe(shell);
  });
});
