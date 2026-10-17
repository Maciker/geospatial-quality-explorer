import type { AlexaFindingCard } from "./alexaSimApi";

export type FindingCardsState = {
  readonly cards: readonly AlexaFindingCard[];
  readonly selectedId: string | null;
};

type NextFindingCardsOptions = {
  /** When false, drop prior cards even if runId is null (lost session / invalid context). */
  readonly contextValid?: boolean;
};

/**
 * Replies only carry the cards a tool touched, so the panel accumulates them per run:
 * a reply without cards keeps the list, an explanation updates and selects its card,
 * and a different run id starts over. Invalid context clears the list.
 */
export function nextFindingCards(
  previous: FindingCardsState,
  incoming: readonly AlexaFindingCard[],
  runId: string | null,
  options?: NextFindingCardsOptions,
): FindingCardsState {
  if (options?.contextValid === false) {
    return { cards: [], selectedId: null };
  }
  const sameRun = runId === null ? previous.cards : previous.cards.filter((card) => card.findingId.startsWith(`${runId}:`));
  const cards = [...sameRun];
  for (const card of incoming) {
    const index = cards.findIndex((existing) => existing.findingId === card.findingId);
    if (index === -1) cards.push(card);
    else cards[index] = card;
  }
  const selectedStillShown = cards.some((card) => card.findingId === previous.selectedId);
  const selectedId = incoming.length === 1
    ? incoming[0]!.findingId
    : selectedStillShown ? previous.selectedId : preferredSelection(cards);
  return { cards, selectedId };
}

/** Prefer a card with map geometry so validate→fit frames a real overlay, not DEMO-EMPTY. */
export function preferredSelection(cards: readonly AlexaFindingCard[]): string | null {
  return cards.find((card) => !isMissingGeometry(card))?.findingId ?? cards[0]?.findingId ?? null;
}

/** Skip map refit when the user selects a finding that has nothing to draw. */
export function shouldRefitMapOnSelect(finding: AlexaFindingCard | undefined): boolean {
  return finding != null && !isMissingGeometry(finding);
}

export function isMissingGeometry(finding: { readonly geometry: unknown }): boolean {
  return finding.geometry === null || finding.geometry === undefined;
}
