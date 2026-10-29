import * as forge from "node-forge";
import { createHash, verify, X509Certificate } from "crypto";

export interface SignatureInspection {
  scope: "local-integrity";
  signatureSyntax: "supported" | "unsupported" | "invalid";
  signedRevisionIntegrity: "valid" | "invalid" | "unknown";
  currentFileCoverage: "entire-file" | "signed-revision-only" | "unknown";
  certificateTrust: "not-checked";
  revocationStatus: "not-checked";
  timestampStatus: "not-checked";
  status: "intact" | "modified" | "unsigned" | "unsupported";
  signer?: string;
  appendedBytes?: number;
  certificateValidNow?: boolean;
  certificateFingerprint?: string;
  certificateIssuer?: string;
  selfSigned?: boolean;
  certification?: boolean;
  cryptographicIntegrity?: boolean;
  detail?: string;
}

/** A bounded lexical view, not a PDF document parser. Offsets stay byte-identical.
 * Literal strings, hex strings, comments and directly-sized stream bodies cannot
 * contribute dictionary keys or object markers to the supported-format search.
 * Unusual/indirect stream lengths are intentionally left to a full validator.
 */
function structuralText(input: Buffer): string | undefined {
  const masked = Buffer.from(input);
  const whitespace = (value: number) => value === 0 || value === 9 || value === 10 || value === 12 || value === 13 || value === 32;
  const dictionaries: number[] = [];
  let lastDictionaryStart = -1;
  let lastDictionaryEnd = -1;
  let position = 0;
  while (position < input.length) {
    const start = position;
    const value = input[position];
    if (value === 37) { // comment
      while (position < input.length && input[position] !== 10 && input[position] !== 13) position++;
      masked.fill(32, start, position);
    } else if (value === 40) { // literal string, including escaped parentheses and line continuations
      let depth = 1;
      position++;
      while (position < input.length && depth) {
        if (input[position] === 92) { position += 2; continue; }
        if (input[position] === 40 && ++depth > 256) return undefined;
        if (input[position] === 41) depth--;
        position++;
      }
      if (depth) return undefined;
      masked.fill(32, start, Math.min(position, input.length));
    } else if (value === 60 && input[position + 1] === 60) {
      if (dictionaries.length >= 256) return undefined;
      dictionaries.push(position);
      position += 2;
    } else if (value === 60) { // hex string
      position++;
      while (position < input.length && input[position] !== 62) {
        const digit = input[position];
        if (!whitespace(digit) && !(digit >= 48 && digit <= 57) && !(digit >= 65 && digit <= 70) && !(digit >= 97 && digit <= 102)) return undefined;
        position++;
      }
      if (position === input.length) return undefined;
      masked.fill(32, start, ++position);
    } else if (value === 62 && input[position + 1] === 62) {
      const dictionaryStart = dictionaries.pop();
      if (dictionaryStart === undefined) return undefined;
      lastDictionaryStart = dictionaryStart;
      lastDictionaryEnd = position + 2;
      position += 2;
    } else if (value === 115 && (position === 0 || whitespace(input[position - 1])) &&
        input.subarray(position, position + 6).toString("ascii") === "stream" && whitespace(input[position + 6])) {
      if (lastDictionaryStart < 0 || !masked.subarray(lastDictionaryEnd, position).every(whitespace)) return undefined;
      const dictionary = masked.subarray(lastDictionaryStart, lastDictionaryEnd).toString("latin1");
      const lengthPattern = /\/Length\s+(\d+)\b(?!\s+\d+\s+R)/g;
      const lengthMatch = lengthPattern.exec(dictionary);
      if (!lengthMatch || lengthPattern.exec(dictionary)) return undefined;
      const length = Number(lengthMatch[1]);
      position += 6;
      if (input[position] === 13) position++;
      if (input[position] !== 10) return undefined;
      position++;
      const end = position + length;
      if (!Number.isSafeInteger(end) || end > input.length) return undefined;
      masked.fill(32, position, end);
      position = end;
      while (position < input.length && whitespace(input[position])) position++;
      if (input.subarray(position, position + 9).toString("ascii") !== "endstream" ||
          !whitespace(input[position + 9])) return undefined;
      position += 9;
    } else {
      position++;
    }
  }
  if (dictionaries.length) return undefined;
  return masked.toString("latin1");
}

/** Limited local integrity check for one detached RSA/SHA-256 PDF signature.
 * Does not establish trust, revocation, legal status or safe PDF rendering.
 */
export function inspectPdfSignature(buffer: Buffer): SignatureInspection {
  const unverified = {
    scope: "local-integrity", signatureSyntax: "unsupported", signedRevisionIntegrity: "unknown",
    currentFileCoverage: "unknown", certificateTrust: "not-checked", revocationStatus: "not-checked",
    timestampStatus: "not-checked",
  } as const;
  const unsupported = (detail: string, signatureSyntax: "unsupported" | "invalid" = "unsupported"): SignatureInspection =>
    ({ ...unverified, status: "unsupported", signatureSyntax, detail });
  if (!Buffer.isBuffer(buffer) || buffer.length > 64 * 1024 * 1024) return unsupported("size-limit");
  const text = buffer.toString("latin1");
  if (!text.startsWith("%PDF-")) return unsupported("not-a-pdf", "invalid");
  const structure = structuralText(buffer);
  if (structure === undefined) return unsupported("unsupported-pdf-tokenization");
  const rangePattern = /\/ByteRange\b/g;
  const firstRange = rangePattern.exec(structure);
  if (!firstRange) return /\/Type\s*\/Sig\b|\/FT\s*\/Sig\b|\/Type\s*\/ObjStm\b/.test(structure)
    ? unsupported("signature-without-byte-range") : { ...unverified, status: "unsigned" };
  if (rangePattern.exec(structure)) return unsupported("multiple-signatures");
  try {
    const rangePosition = firstRange.index;
    const match = /^\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/.exec(structure.slice(rangePosition));
    if (!match) return unsupported("invalid-byte-range", "invalid");
    const [start, firstLength, secondStart, secondLength] = match.slice(1).map(Number);
    const end = secondStart + secondLength;
    // PDF dictionaries are unordered: ByteRange can precede or follow Contents.
    const rangeIsSigned = rangePosition + match[0].length <= firstLength ||
      (rangePosition >= secondStart && rangePosition + match[0].length <= end);
    if (![start, firstLength, secondStart, secondLength, end].every(Number.isSafeInteger) ||
        start !== 0 || !rangeIsSigned || secondStart <= firstLength ||
        secondLength <= 0 || end > buffer.length) {
      return unsupported("invalid-byte-range", "invalid");
    }
    if (secondStart - firstLength > 1024 * 1024) return unsupported("signature-size-limit");
    // The only unsigned bytes must be the signature's hex Contents value.
    if (!/\/Contents\s*$/.test(structure.slice(Math.max(0, firstLength - 30), firstLength))) return unsupported("invalid-contents-gap", "invalid");
    const gap = text.slice(firstLength, secondStart);
    if (!/^<[0-9a-fA-F]+>$/.test(gap) || (gap.length - 2) % 2) return unsupported("invalid-contents-gap", "invalid");
    const objectStart = structure.lastIndexOf(" obj", rangePosition);
    const objectEnd = structure.indexOf("endobj", rangePosition);
    if (objectStart < 0 || objectEnd < secondStart || objectEnd >= end) return unsupported("invalid-signature-object", "invalid");
    const dictionary = structure.slice(objectStart, objectEnd);
    const exactlyOne = (pattern: RegExp): boolean => !!pattern.exec(dictionary) && !pattern.exec(dictionary);
    if (!/\/SubFilter\s*\/adbe\.pkcs7\.detached\b/.test(dictionary) ||
        !exactlyOne(/\/Contents\b/g) || !exactlyOne(/\/SubFilter\b/g)) return unsupported("signature-format");
    const f = ((forge as unknown as { default?: typeof forge }).default || forge);
    const raw = Buffer.from(gap.slice(1, -1), "hex");
    const reader = f.util.createBuffer(raw.toString("binary"));
    // Forge supports this options object at runtime; its declaration only lists strict:boolean.
    const parseDer = f.asn1.fromDer as unknown as (input: typeof reader, options: { parseAllBytes: boolean }) => forge.asn1.Asn1;
    const cms = parseDer(reader, { parseAllBytes: false });
    if (!/^\x00*$/.test(reader.getBytes())) return unsupported("nonzero-signature-padding", "invalid");
    const children = (node: forge.asn1.Asn1): forge.asn1.Asn1[] => {
      if (!Array.isArray(node.value)) throw new Error("ASN.1 sequence expected");
      return node.value as forge.asn1.Asn1[];
    };
    const oid = (node: forge.asn1.Asn1): string => {
      if (typeof node.value !== "string" || node.tagClass !== f.asn1.Class.UNIVERSAL ||
          node.type !== f.asn1.Type.OID || node.constructed) throw new Error("OID expected");
      return f.asn1.derToOid(node.value);
    };
    const der = (node: forge.asn1.Asn1): string => f.asn1.toDer(node).getBytes();
    const outer = children(cms);
    if (outer.length !== 2 || oid(outer[0]) !== "1.2.840.113549.1.7.2") return unsupported("cms-content-type");
    const data = children(children(outer[1])[0]);
    const contentInfo = children(data[2]);
    if (contentInfo.length !== 1 || oid(contentInfo[0]) !== "1.2.840.113549.1.7.1") return unsupported("cms-not-detached");
    const signerInfos = children(data[data.length - 1]);
    if (signerInfos.length !== 1) return unsupported("multiple-cms-signers");
    const info = children(signerInfos[0]);
    if (info.length !== 6 || oid(children(info[2])[0]) !== "2.16.840.1.101.3.4.2.1" ||
        !["1.2.840.113549.1.1.1", "1.2.840.113549.1.1.11"].includes(oid(children(info[4])[0])) ||
        info[3].tagClass !== f.asn1.Class.CONTEXT_SPECIFIC || info[3].type !== 0) {
      return unsupported("cms-algorithm");
    }
    const identity = children(info[1]);
    if (identity.length !== 2) return unsupported("cms-signer-identity");
    const certContainer = data.find((node, index) => index > 2 && node.tagClass === f.asn1.Class.CONTEXT_SPECIFIC && node.type === 0);
    if (!certContainer) return unsupported("missing-certificate");
    const certificates = children(certContainer).filter((certificate) => {
      const tbs = children(children(certificate)[0]);
      const offset = tbs[0].tagClass === f.asn1.Class.CONTEXT_SPECIFIC ? 1 : 0;
      return der(tbs[offset]) === der(identity[1]) && der(tbs[offset + 2]) === der(identity[0]);
    });
    if (certificates.length !== 1) return unsupported("ambiguous-certificate");
    const certificate = new X509Certificate(Buffer.from(der(certificates[0]), "binary"));
    if (certificate.publicKey.asymmetricKeyType !== "rsa") return unsupported("key-algorithm");
    const attributes = children(info[3]);
    const findAttribute = (type: string) => attributes.filter(attr => oid(children(attr)[0]) === type);
    const digests = findAttribute("1.2.840.113549.1.9.4");
    const types = findAttribute("1.2.840.113549.1.9.3");
    if (digests.length !== 1 || types.length !== 1) return unsupported("cms-attributes");
    const digestValues = children(children(digests[0])[1]);
    const typeValues = children(children(types[0])[1]);
    if (digestValues.length !== 1 || typeValues.length !== 1 || oid(typeValues[0]) !== "1.2.840.113549.1.7.1" ||
        digestValues[0].tagClass !== f.asn1.Class.UNIVERSAL || digestValues[0].type !== f.asn1.Type.OCTETSTRING ||
        digestValues[0].constructed || typeof digestValues[0].value !== "string") return unsupported("cms-attributes");
    const expected = Buffer.from(digestValues[0].value, "binary");
    const actual = createHash("sha256").update(buffer.subarray(0, firstLength)).update(buffer.subarray(secondStart, end)).digest();
    const signedAttributes = f.asn1.create(f.asn1.Class.UNIVERSAL, f.asn1.Type.SET, true, attributes);
    if (typeof info[5].value !== "string") return unsupported("cms-signature-value");
    const signatureValid = verify("sha256", Buffer.from(der(signedAttributes), "binary"), certificate.publicKey, Buffer.from(info[5].value, "binary"));
    const cryptographicIntegrity = signatureValid && actual.equals(expected);
    const appendedBytes = buffer.length - end;
    const now = Date.now();
    return {
      ...unverified,
      signatureSyntax: "supported",
      signedRevisionIntegrity: cryptographicIntegrity ? "valid" : "invalid",
      currentFileCoverage: appendedBytes === 0 ? "entire-file" : "signed-revision-only",
      status: cryptographicIntegrity && appendedBytes === 0 ? "intact" : "modified",
      cryptographicIntegrity,
      signer: certificate.subject,
      certificateIssuer: certificate.issuer,
      certificateFingerprint: certificate.fingerprint256,
      selfSigned: certificate.subject === certificate.issuer && certificate.verify(certificate.publicKey),
      certificateValidNow: now >= Date.parse(certificate.validFrom) && now <= Date.parse(certificate.validTo),
      appendedBytes,
      detail: !signatureValid || !actual.equals(expected) ? "cryptographic-check-failed" : appendedBytes ? "bytes-after-signed-revision" : "integrity-only-trust-not-checked",
    };
  } catch {
    return unsupported("malformed-or-unsupported-signature");
  }
}
