import * as fs from "fs";
import { createHash } from "crypto";

/** Fingerprint a bounded, stable on-disk PDF before placing it in the signing queue. */
export function fileFingerprint(filepath: string): string {
  const file = fs.openSync(filepath, "r");
  try {
    const before = fs.fstatSync(file);
    if (!before.isFile() || before.size > 64 * 1024 * 1024) throw new Error("PDF size limit: 64 MiB");
    const hash = createHash("sha256");
    const chunk = Buffer.alloc(64 * 1024);
    let total = 0, count: number;
    while ((count = fs.readSync(file, chunk, 0, chunk.length, null)) > 0) {
      total += count;
      if (total > 64 * 1024 * 1024) throw new Error("PDF size limit: 64 MiB");
      hash.update(chunk.subarray(0, count));
    }
    const after = fs.fstatSync(file);
    if (total !== before.size || before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs) {
      throw new Error("PDF changed while being read");
    }
    return hash.digest("hex");
  } finally { fs.closeSync(file); }
}


/** Only pin an existing complete revision, not a partially written export. */
export function completeExportFingerprint(filepath: string): string | undefined {
  const file = fs.openSync(filepath, "r");
  try {
    const size = fs.fstatSync(file).size;
    if (size > 64 * 1024 * 1024) throw new Error("PDF size limit: 64 MiB");
    if (size < 12) return undefined;
    const head = Buffer.alloc(5); fs.readSync(file, head, 0, 5, 0);
    const tail = Buffer.alloc(Math.min(size, 2048)); fs.readSync(file, tail, 0, tail.length, size - tail.length);
    if (head.toString("ascii") !== "%PDF-" || !/%%EOF[\x00\x09\x0a\x0c\x0d\x20]*$/.test(tail.toString("latin1"))) return undefined;
  } finally { fs.closeSync(file); }
  return fileFingerprint(filepath);
}
