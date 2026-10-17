const CHUNK = 8;

/** Parts of an id split after `:` / `-`, then long hex runs chunked; render with `<wbr />` between so copied text stays exact. */
export function splitBreakableId(value: string): string[] {
  const bySeparator = value.split(/(?<=[:-])/);
  return bySeparator.flatMap((part) => chunkLongHexRun(part));
}

/** Chunk only long hexadecimal runs (finding/run hashes). Keep rule tokens like `geometry.invalid` intact. */
function chunkLongHexRun(part: string): string[] {
  const trailing = part.endsWith(":") || part.endsWith("-") ? part.slice(-1) : "";
  const body = trailing ? part.slice(0, -1) : part;
  if (body.length <= CHUNK || !/^[a-fA-F0-9]+$/.test(body)) return [part];
  const chunks: string[] = [];
  for (let index = 0; index < body.length; index += CHUNK) {
    const slice = body.slice(index, index + CHUNK);
    const isLast = index + CHUNK >= body.length;
    chunks.push(isLast ? slice + trailing : slice);
  }
  return chunks;
}
