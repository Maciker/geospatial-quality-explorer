type QgisBundle = {
  readonly runId: string;
  readonly files: { readonly geojson: string; readonly metadata: string; readonly project: string; readonly style: string };
};

/** Same entry names as `pnpm gis export qgis`, so the project's `./findings.geojson` datasource resolves. */
export function qgisBundleZip(bundle: QgisBundle): { fileName: string; bytes: Uint8Array<ArrayBuffer> } {
  return {
    fileName: `qgis-${bundle.runId.slice(0, 8)}.zip`,
    bytes: storedZip([
      ["findings.qgs", bundle.files.project],
      ["findings.geojson", bundle.files.geojson],
      ["findings.qml", bundle.files.style],
      ["run-metadata.json", bundle.files.metadata],
    ]),
  };
}

const DOS_DATE_1980_01_01 = 0x0021;
const UTF8_NAMES = 0x0800;

/** Minimal uncompressed ZIP writer; the bundle is small text, so compression is not worth a dependency. */
function storedZip(entries: ReadonlyArray<readonly [string, string]>): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const [name, content] of entries) {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length + data.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, UTF8_NAMES, true);
    localView.setUint16(12, DOS_DATE_1980_01_01, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    local.set(data, 30 + nameBytes.length);
    const central = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, UTF8_NAMES, true);
    centralView.setUint16(14, DOS_DATE_1980_01_01, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  const parts = [...locals, ...centrals, end];
  const zip = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let position = 0;
  for (const part of parts) {
    zip.set(part, position);
    position += part.length;
  }
  return zip;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
