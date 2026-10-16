/** Parts of an id split after `:` and `-`; render them with `<wbr />` between so copied text stays exact. */
export function splitBreakableId(value: string): string[] {
  return value.split(/(?<=[:-])/);
}
