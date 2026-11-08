const PDF_WHITESPACE = "\0\t\n\f\r ";

export function trimPdfEnd(value: string): string {
  let end = value.length;
  while (end > 0 && PDF_WHITESPACE.includes(value[end - 1])) end--;
  return value.slice(0, end);
}
