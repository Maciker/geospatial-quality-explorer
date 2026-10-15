import { describe, expect, it } from "vitest";
import type { AlexaFindingCard } from "./alexaSimApi";
import { nextFindingCards } from "./findingCards";

const run = "a".repeat(64);
const card = (index: number, runId = run): AlexaFindingCard => ({
  findingId: `${runId}:${index}:geometry.invalid`,
  ruleId: "geometry.invalid",
  featureId: `f${index}`,
  severity: "error",
  explanation: `e${index}`,
  suggestedAction: "s",
  geometry: null,
});

describe("nextFindingCards", () => {
  it("keeps the listed cards when a reply carries no cards", () => {
    const listed = nextFindingCards({ cards: [], selectedId: null }, [card(1), card(2)], run);

    const afterExport = nextFindingCards(listed, [], run);

    expect(afterExport.cards.map((item) => item.featureId)).toEqual(["f1", "f2"]);
    expect(afterExport.selectedId).toBe(card(1).findingId);
  });

  it("keeps the list and selects the card an explanation is about", () => {
    const listed = nextFindingCards({ cards: [], selectedId: null }, [card(1), card(2), card(3)], run);

    const explained = nextFindingCards(listed, [{ ...card(2), explanation: "detailed" }], run);

    expect(explained.cards.map((item) => item.featureId)).toEqual(["f1", "f2", "f3"]);
    expect(explained.cards[1]?.explanation).toBe("detailed");
    expect(explained.selectedId).toBe(card(2).findingId);
  });

  it("drops cards from an earlier run when a new run starts", () => {
    const listed = nextFindingCards({ cards: [], selectedId: null }, [card(1)], run);
    const otherRun = "b".repeat(64);

    const next = nextFindingCards(listed, [], otherRun);

    expect(next).toEqual({ cards: [], selectedId: null });
  });

  it("clears cards when the session context is no longer valid", () => {
    const listed = nextFindingCards({ cards: [], selectedId: null }, [card(1), card(2)], run);

    const cleared = nextFindingCards(listed, [], null, { contextValid: false });

    expect(cleared).toEqual({ cards: [], selectedId: null });
  });

  it("keeps cards when runId is null but context remains valid", () => {
    const listed = nextFindingCards({ cards: [], selectedId: null }, [card(1)], run);

    const afterEmpty = nextFindingCards(listed, [], null);

    expect(afterEmpty.cards).toHaveLength(1);
  });
});
