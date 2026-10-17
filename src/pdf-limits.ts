import PDFXRefStreamParser from "pdf-lib/cjs/core/parser/PDFXRefStreamParser";
import DecodeStream from "pdf-lib/cjs/core/streams/DecodeStream";
import { AsyncLocalStorage } from "node:async_hooks";

export const MAX_DECODED_STREAM_BYTES = 64 * 1024 * 1024;
export const MAX_DECODED_DOCUMENT_BYTES = 128 * 1024 * 1024;
const decodeBudget = new AsyncLocalStorage<{ used: number; limit: number }>();
export function withPdfDecodeBudget<T>(operation: () => Promise<T>, limit = MAX_DECODED_DOCUMENT_BYTES): Promise<T> {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_DECODED_DOCUMENT_BYTES) throw new RangeError("Invalid PDF decode budget");
  return decodeBudget.run({ used: 0, limit }, operation);
}

export function decodedCapacity(requested: number, current: number, minimum: number): number {
  if (!Number.isSafeInteger(requested) || requested < 0 || requested > MAX_DECODED_STREAM_BYTES ||
      !Number.isSafeInteger(current) || current < 0 || current > MAX_DECODED_STREAM_BYTES ||
      !Number.isSafeInteger(minimum) || minimum <= 0 || minimum > MAX_DECODED_STREAM_BYTES) {
    throw new Error("PDF decoded stream budget exceeded");
  }
  if (requested <= current) return current;
  let capacity = minimum;
  while (capacity < requested) capacity *= 2;
  if (capacity > MAX_DECODED_STREAM_BYTES) throw new Error("PDF decoded stream budget exceeded");
  return capacity;
}

const streamPrototype = DecodeStream.prototype as unknown as {
  ensureBuffer(this: { buffer: Uint8Array; minBufferLength: number }, requested: number): Uint8Array;
};
const ensureBuffer = streamPrototype.ensureBuffer;
if (typeof ensureBuffer !== "function") throw new Error("Unsupported PDF stream parser version");
streamPrototype.ensureBuffer = function (requested) {
  const previous = this.buffer.byteLength;
  const capacity = decodedCapacity(requested, previous, this.minBufferLength);
  const budget = decodeBudget.getStore();
  const growth = capacity - previous;
  if (budget && budget.used + growth > budget.limit) {
    throw new Error("PDF decoded document budget exceeded");
  }
  const result = ensureBuffer.call(this, requested);
  if (budget) budget.used += growth;
  return result;
};

// pdf-lib 1.17.1 trusts XRef entry counts even after EOF. Enforce the budget
// before its synchronous allocator runs. Keep this guard beside the pinned API.
export const MAX_XREF_ENTRIES = 100_000;
export function validateXRefEntries(parser: {
  byteWidths: number[];
  subsections: { firstObjectNumber: number; length: number }[];
  bytes: { length: number; offset(): number };
}): void {
  const valid = (n: number) => Number.isSafeInteger(n) && n >= 0;
  const widths = parser.byteWidths;
  if (widths.length !== 3 || widths.some((n) => !valid(n) || n > 4)) {
    throw new Error("Unsupported or malformed PDF XRef widths");
  }
  let count = 0;
  for (const section of parser.subsections) {
    if (!valid(section.firstObjectNumber) || !valid(section.length) ||
        !valid(section.firstObjectNumber + section.length)) {
      throw new Error("Malformed PDF XRef index");
    }
    count += section.length;
    if (!valid(count) || count > MAX_XREF_ENTRIES) {
      throw new Error("PDF XRef entry budget exceeded");
    }
  }
  const available = parser.bytes.length - parser.bytes.offset();
  const stride = widths.reduce((sum, width) => sum + width, 0);
  if (!valid(available) || count * stride > available) {
    throw new Error("Truncated PDF XRef stream");
  }
}

const prototype = PDFXRefStreamParser.prototype as unknown as {
  parseEntries: (this: Parameters<typeof validateXRefEntries>[0]) => unknown;
};
const original = prototype.parseEntries;
if (typeof original !== "function") throw new Error("Unsupported PDF parser version");
prototype.parseEntries = function () {
  validateXRefEntries(this);
  return original.call(this);
};
