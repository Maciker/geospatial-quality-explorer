import { createHash } from "node:crypto";
import type { Digest } from "../application/validateDataset.js";

export class Sha256Digest implements Digest {
  sha256(value: Uint8Array | string): string {
    return createHash("sha256").update(value).digest("hex");
  }
}
