/** Insert soft wrap points so long finding/run ids break at separators, not mid-token. */
export function formatBreakableId(value: string): string {
  return value.replace(/([:-])/g, "$1\u200b");
}
