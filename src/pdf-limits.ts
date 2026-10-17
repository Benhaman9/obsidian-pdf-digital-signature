import PDFXRefStreamParser from "pdf-lib/cjs/core/parser/PDFXRefStreamParser";

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
