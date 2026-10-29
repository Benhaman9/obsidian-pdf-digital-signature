import { setTimeout, clearTimeout } from "timers";
import * as fs from "fs";
import { createHash } from "crypto";
import { PDFDocument, PDFInvalidObject } from "pdf-lib";
import { withPdfDecodeBudget } from "./pdf-limits";

const MAX_PDF_BYTES = 64 * 1024 * 1024;
export type ExportReadinessCode = "EXPORT_TIMEOUT" | "EXPORT_INVALID" | "EXPORT_CHANGED" | "EXPORT_TOO_LARGE" | "EXPORT_ABORTED";

export class ExportReadinessError extends Error {
  constructor(public readonly code: ExportReadinessCode) {
    super(code);
    this.name = "ExportReadinessError";
  }
}

export interface ExportReadinessOptions {
  timeoutMs?: number;
  pollMs?: number;
  stableChecks?: number;
  signal?: AbortSignal;
  expectedFingerprint?: string;
  onPhase?: (phase: "waiting" | "validating") => void;
}

const bounded = (value: number | undefined, fallback: number, min: number, max: number): number =>
  Number.isFinite(value) ? Math.max(min, Math.min(max, Math.floor(value!))) : fallback;

function sameFile(a: fs.Stats, b: fs.Stats): boolean {
  return a.dev === b.dev && a.ino === b.ino && a.size === b.size &&
    a.mtimeMs === b.mtimeMs && a.ctimeMs === b.ctimeMs;
}

function checkAbort(signal?: AbortSignal): void {
  if (signal?.aborted) throw new ExportReadinessError("EXPORT_ABORTED");
}

async function pause(ms: number, signal?: AbortSignal): Promise<void> {
  checkAbort(signal);
  await new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); signal?.removeEventListener("abort", abort); reject(new ExportReadinessError("EXPORT_ABORTED")); };
    const timer = setTimeout(() => { signal?.removeEventListener("abort", abort); resolve(); }, ms);
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) abort();
  });
}

/** Read through a handle so growth and pathname replacement cannot silently change the candidate. */
async function readCandidate(filepath: string, collect: boolean, signal?: AbortSignal): Promise<{ fingerprint: string; bytes: Buffer; stable: boolean }> {
  const handle = await fs.promises.open(filepath, "r");
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.size > MAX_PDF_BYTES) throw new ExportReadinessError("EXPORT_TOO_LARGE");
    const chunks: Buffer[] = [];
    const chunk = Buffer.alloc(64 * 1024);
    const hash = createHash("sha256");
    let total = 0;
    for (;;) {
      checkAbort(signal);
      const { bytesRead } = await handle.read(chunk, 0, chunk.length, null);
      if (!bytesRead) break;
      total += bytesRead;
      if (total > MAX_PDF_BYTES) throw new ExportReadinessError("EXPORT_TOO_LARGE");
      hash.update(chunk.subarray(0, bytesRead));
      if (collect) chunks.push(Buffer.from(chunk.subarray(0, bytesRead)));
    }
    const after = await handle.stat();
    const current = await fs.promises.stat(filepath);
    return { fingerprint: hash.digest("hex"), bytes: collect ? Buffer.concat(chunks, total) : Buffer.alloc(0),
      stable: total === before.size && sameFile(before, after) && sameFile(after, current) };
  } finally { await handle.close(); }
}

function hasCompleteEnvelope(bytes: Buffer): boolean {
  if (!/^%PDF-\d\.\d/.test(bytes.subarray(0, 16).toString("latin1"))) return false;
  const tail = bytes.subarray(Math.max(0, bytes.length - 4096)).toString("latin1");
  const end = /startxref\s+(\d+)\s+%%EOF[\x00\x09\x0a\x0c\x0d\x20]*$/.exec(tail);
  if (!end) return false;
  const offset = Number(end[1]);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset >= bytes.length) return false;
  const xref = bytes.subarray(offset, Math.min(bytes.length, offset + 2048)).toString("latin1");
  return /^xref\s/.test(xref) || /^\d+\s+\d+\s+obj\b/.test(xref) && /\/Type\s*\/XRef\b/.test(xref.split("stream")[0]);
}

/** Wait for a complete, stable exported PDF. A caller-supplied identity is never advanced to newer content. */
export async function waitForExport(filepath: string, options: ExportReadinessOptions = {}): Promise<string> {
  const timeout = bounded(options.timeoutMs, 15_000, 50, 60_000);
  const poll = bounded(options.pollMs, 200, 5, 1000);
  const checks = bounded(options.stableChecks, 3, 2, 10);
  const deadline = Date.now() + timeout;
  let previous: fs.Stats | undefined, stableCount = 0, invalid = false, lastInvalidFingerprint: string | undefined;
  options.onPhase?.("waiting");
  for (;;) {
    checkAbort(options.signal);
    if (Date.now() >= deadline) throw new ExportReadinessError(invalid ? "EXPORT_INVALID" : "EXPORT_TIMEOUT");
    try {
      const stat = await fs.promises.stat(filepath);
      if (!stat.isFile() || stat.size > MAX_PDF_BYTES) throw new ExportReadinessError("EXPORT_TOO_LARGE");
      stableCount = previous && sameFile(previous, stat) ? stableCount + 1 : 1;
      previous = stat;
      if (stat.size > 0 && stableCount >= checks) {
        const candidate = await readCandidate(filepath, true, options.signal);
        if (candidate.stable) {
          if (options.expectedFingerprint && candidate.fingerprint !== options.expectedFingerprint) throw new ExportReadinessError("EXPORT_CHANGED");
          if (candidate.fingerprint !== lastInvalidFingerprint && hasCompleteEnvelope(candidate.bytes)) {
            options.onPhase?.("validating");
            let valid = false;
            try {
              const doc = await withPdfDecodeBudget(() => PDFDocument.load(candidate.bytes, {
                ignoreEncryption: false, throwOnInvalidObject: true, parseSpeed: 20,
              }));
              valid = doc.getPageCount() > 0 && !doc.context.enumerateIndirectObjects().some(([, object]) => object instanceof PDFInvalidObject);
            } catch { checkAbort(options.signal); }
            checkAbort(options.signal);
            if (Date.now() >= deadline) throw new ExportReadinessError("EXPORT_TIMEOUT");
            if (valid) {
              const after = await readCandidate(filepath, false, options.signal);
              if (!after.stable || after.fingerprint !== candidate.fingerprint) throw new ExportReadinessError("EXPORT_CHANGED");
              return candidate.fingerprint;
            }
          }
          invalid = true;
          lastInvalidFingerprint = candidate.fingerprint;
        }
      }
    } catch (error) {
      if (error instanceof ExportReadinessError) throw error;
      if ((error as NodeJS.ErrnoException).code !== "ENOENT" && (error as NodeJS.ErrnoException).code !== "EBUSY" && (error as NodeJS.ErrnoException).code !== "EPERM") throw error;
      previous = undefined; stableCount = 0;
    }
    await pause(Math.min(poll, Math.max(1, deadline - Date.now())), options.signal);
  }
}
