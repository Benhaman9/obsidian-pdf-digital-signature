import * as forge from "node-forge";
import { withPdfDecodeBudget } from "./pdf-limits";
import { PDFDocument, PDFSignature, PDFName, PDFDict, PDFInvalidObject } from "pdf-lib";
import { pdflibAddPlaceholder } from "@signpdf/placeholder-pdf-lib";
import { SignPdf } from "@signpdf/signpdf";
import { P12Signer } from "@signpdf/signer-p12";
import * as fs from "fs";
import * as path from "path";
import { createHash, randomUUID } from "crypto";
import { t } from "./i18n";
import { inspectPdfSignature } from "./verifier";

type ForgeModule = typeof forge;
export const MAX_SIGNING_PDF_BYTES = 64 * 1024 * 1024;
export const MAX_CERTIFICATE_BYTES = 4 * 1024 * 1024;

async function checkSigningFileSizes(filePath: string, certPath: string): Promise<void> {
  const [pdf, certificate] = await Promise.all([fs.promises.stat(filePath), fs.promises.stat(certPath)]);
  if (pdf.size > MAX_SIGNING_PDF_BYTES || certificate.size > MAX_CERTIFICATE_BYTES) {
    throw new Error(t("error_file_too_large"));
  }
}

function getForge(): ForgeModule {
  const forgeObject = forge as unknown as { default?: ForgeModule };
  return forgeObject.default || (forge as unknown as ForgeModule);
}

export interface SignatureMetadata {
  signerName: string;
  onVerifying?: () => void;
  expectedFingerprint?: string;
  signatureMode?: "approval" | "certify";
  reason?: string;
  location?: string;
  contactInfo?: string;
}

export interface CertificateInfo {
  exists: boolean;
  valid: boolean;
  commonName?: string;
  issuer?: string;
  fingerprint?: string;
  selfSigned?: boolean;
  notBefore?: Date;
  notAfter?: Date;
  daysRemaining?: number;
  isExpiringSoon?: boolean; // <= 30 dÃ­as
  isExpired?: boolean;
  error?: string;
}

function inspectCertificate(p12Buffer: Buffer, password: string): CertificateInfo {
  try {
    const f = getForge();
    const p12Asn1 = f.asn1.fromDer(p12Buffer.toString("binary"));
    const p12 = f.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
    // Use the same encrypted RSA key bag that P12Signer uses for the signature.
    const bags = p12.safeContents.flatMap((content) => content.safeBags);
    const keyBags = bags.filter((bag) => bag.type === f.pki.oids.pkcs8ShroudedKeyBag);
    if (keyBags.length > 1) return { exists: true, valid: false, error: t("error_ambiguous_cert") };
    // P12Signer uses keyBags[0], so never silently select a later usable key.
    const key = keyBags[0]?.key;
    const matchingCertificates = key ? bags.filter((bag) => {
      const publicKey = bag.cert?.publicKey as forge.pki.rsa.PublicKey | undefined;
      return publicKey?.n && publicKey.e && key.n.compareTo(publicKey.n) === 0 && key.e.compareTo(publicKey.e) === 0;
    }).map((bag) => bag.cert!) : [];
    const certificateDer = (cert: forge.pki.Certificate) => f.asn1.toDer(f.pki.certificateToAsn1(cert)).getBytes();
    const distinctCertificates = new Map(matchingCertificates.map(cert => [certificateDer(cert), cert]));
    if (distinctCertificates.size > 1) return { exists: true, valid: false, error: t("error_ambiguous_cert") };
    const cert = matchingCertificates[matchingCertificates.length - 1];

    if (!cert) {
      return { exists: true, valid: false, error: t("error_no_signing_cert") };
    }
    if (key!.n.bitLength() < 2048) return { exists: true, valid: false, error: t("error_weak_rsa") };
    const usage = cert.getExtension("keyUsage") as { digitalSignature?: boolean; nonRepudiation?: boolean } | null;
    if (usage && !usage.digitalSignature && !usage.nonRepudiation) {
      return { exists: true, valid: false, error: t("error_cert_key_usage") };
    }

    const notBefore = cert.validity.notBefore;
    const notAfter = cert.validity.notAfter;
    const now = new Date();
    const diffMs = notAfter.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const commonNameAttr = cert.subject.getField("CN");
    const commonName = commonNameAttr && commonNameAttr.value ? String(commonNameAttr.value) : undefined;
    const isExpired = diffMs <= 0;
    const isNotYetValid = now < notBefore;
    const isExpiringSoon = !isExpired && !isNotYetValid && diffMs <= 30 * 24 * 60 * 60 * 1000;

    return {
      exists: true,
      valid: !isExpired && !isNotYetValid,
      error: isNotYetValid ? t("error_not_yet_valid") : undefined,
      commonName,
      issuer: cert.issuer.attributes.map(attr => `${attr.shortName || attr.name || attr.type}=${String(attr.value)}`).join(", "),
      fingerprint: createHash("sha256").update(Buffer.from(certificateDer(cert), "binary")).digest("hex").toUpperCase().match(/.{2}/g)!.join(":"),
      selfSigned: cert.isIssuer(cert) && cert.verify(cert),
      notBefore,
      notAfter,
      daysRemaining,
      isExpiringSoon,
      isExpired,
    };
  } catch {
    return { exists: true, valid: false, error: t("error_invalid_cert") };
  }
}

/**
 * Inspecciona un certificado PKCS#12 (.pfx / .p12) y extrae vigencia y expiraciÃ³n.
 */
export function getCertificateInfo(certPath: string, password = ""): CertificateInfo {
  if (!fs.existsSync(certPath)) {
    return { exists: false, valid: false };
  }

  try {
    if (fs.statSync(certPath).size > MAX_CERTIFICATE_BYTES) {
      return { exists: true, valid: false, error: t("error_file_too_large") };
    }
    return inspectCertificate(fs.readFileSync(certPath), password);
  } catch {
    return { exists: true, valid: false, error: t("error_invalid_cert") };
  }
}

/**
 * Genera un certificado digital autofirmado X.509 en formato PKCS#12 (.pfx / .p12) en JS puro.
 */
export function createSelfSignedCertificate(
  signerName: string,
  password: string,
  organization = "",
  country = "",
  validityYears = 3
): Buffer {
  if (!password) throw new Error(t("error_password_required"));
  const f = getForge();
  const pki = f.pki;
  const keys = pki.rsa.generateKeyPair(2048);
  const cert = pki.createCertificate();

  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01" + f.util.bytesToHex(f.random.getBytesSync(15));

  const notBefore = new Date();
  notBefore.setDate(notBefore.getDate() - 1);
  const notAfter = new Date();
  notAfter.setFullYear(notBefore.getFullYear() + validityYears);

  cert.validity.notBefore = notBefore;
  cert.validity.notAfter = notAfter;

  const attrs = [
    { name: "commonName", value: signerName },
    ...(organization ? [{ name: "organizationName", value: organization }] : []),
    ...(country ? [{ name: "countryName", value: country }] : []),
  ];

  cert.setSubject(attrs);
  cert.setIssuer(attrs);

  cert.setExtensions([
    { name: "basicConstraints", cA: false },
    {
      name: "keyUsage",
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: false,
      dataEncipherment: false,
    },
  ]);

  cert.sign(keys.privateKey, f.md.sha256.create());

  const protection = {
    generateLocalKeyId: true,
    friendlyName: signerName,
    algorithm: "aes256" as const,
    prfAlgorithm: "sha256" as const,
    count: 100_000,
    saltSize: 16,
    // Forge's PKCS#12 writer supports HMAC-SHA1 only; retain its authenticated
    // container with the same explicit iteration count. PDF signing uses SHA256.
    useMac: true,
  };
  const p12Asn1 = f.pkcs12.toPkcs12Asn1(keys.privateKey, cert, password, protection);

  const p12Der = f.asn1.toDer(p12Asn1).getBytes();
  return Buffer.from(p12Der, "binary");
}

/**
 * Firma digitalmente un Buffer de PDF con un certificado X.509 PKCS#12 (.pfx) en JS puro.
 */
export async function signPdfBuffer(
  pdfBuffer: Buffer,
  p12Buffer: Buffer,
  password: string,
  metadata: SignatureMetadata
): Promise<Buffer> {
  if (!Buffer.isBuffer(pdfBuffer) || !Buffer.isBuffer(p12Buffer)) throw new TypeError("PDF and certificate must be Buffers");
  if (pdfBuffer.length > MAX_SIGNING_PDF_BYTES || p12Buffer.length > MAX_CERTIFICATE_BYTES) {
    throw new Error(t("error_file_too_large"));
  }
  if (metadata.expectedFingerprint !== undefined &&
      createHash("sha256").update(pdfBuffer).digest("hex") !== metadata.expectedFingerprint) {
    throw new Error(t("error_pdf_changed"));
  }
  const certificateInfo = inspectCertificate(p12Buffer, password);
  if (!certificateInfo.valid) {
    throw new Error(certificateInfo.isExpired
      ? t("error_expired_cert")
      : certificateInfo.error || t("error_invalid_cert"));
  }
  if (metadata.signatureMode !== undefined && !["approval", "certify"].includes(metadata.signatureMode)) {
    throw new Error("Unsupported signature mode");
  }
  const signer = new P12Signer(p12Buffer, {
    passphrase: password || "",
  });

  const pdfDoc = await withPdfDecodeBudget(() => PDFDocument.load(pdfBuffer, {
    ignoreEncryption: false,
    throwOnInvalidObject: true,
  }));
  if (pdfDoc.getForm().getFields().some((field) =>
    field instanceof PDFSignature && field.acroField.dict.lookupMaybe(PDFName.of("V"), PDFDict))) {
    throw new Error(t("error_already_signed"));
  }

  if (pdfDoc.catalog.has(PDFName.of("Perms"))) {
    throw new Error(t("error_already_signed"));
  }

  pdflibAddPlaceholder({
    pdfDoc,
    reason: metadata.reason ?? "",
    contactInfo: metadata.contactInfo || "",
    name: metadata.signerName,
    location: metadata.location ?? "",
    signatureLength: 8192,
  });

  // The placeholder library serializes the signature as PDFInvalidObject so it
  // cannot enter an object stream. Preserve that representation when adding DocMDP.
  if (metadata.signatureMode !== "approval") {
    const fields = pdfDoc.getForm().getFields();
    const field = fields[fields.length - 1];
    const signatureRef = field.acroField.dict.get(PDFName.of("V"))!;
    const signatureObject = pdfDoc.context.lookup(signatureRef);
    if (!(signatureObject instanceof PDFInvalidObject)) throw new Error("Invalid signature placeholder");
    const bytes = new Uint8Array(signatureObject.sizeInBytes());
    signatureObject.copyBytesInto(bytes, 0);
    const serialized = Buffer.from(bytes).toString("latin1");
    const reference = pdfDoc.context.obj([{
      Type: "SigRef", TransformMethod: "DocMDP", Data: pdfDoc.context.trailerInfo.Root,
      TransformParams: { Type: "TransformParams", P: 1, V: "1.2" },
    }]);
    const end = serialized.lastIndexOf(">>");
    if (end < 0) throw new Error("Invalid signature placeholder");
    pdfDoc.context.assign(signatureRef as import("pdf-lib").PDFRef, PDFInvalidObject.of(
      Buffer.from(serialized.slice(0, end) + "/Reference " + reference.toString() + "\n" + serialized.slice(end), "latin1")
    ));
    pdfDoc.catalog.set(PDFName.of("Perms"), pdfDoc.context.obj({ DocMDP: signatureRef }));
  }

  const rawBytesWithPlaceholder = await pdfDoc.save({
    useObjectStreams: false,
  });

  const signpdfInstance = new SignPdf();
  const signedBuffer = await signpdfInstance.sign(
    Buffer.from(rawBytesWithPlaceholder),
    signer
  );
  metadata.onVerifying?.();
  if (inspectPdfSignature(signedBuffer).status !== "intact") {
    throw new Error(t("error_signing_verification"));
  }
  return signedBuffer;
}

/**
 * Firma digitalmente un archivo PDF en disco in-place.
 */
export async function signPdfFile(
  filePath: string,
  certPath: string,
  password: string,
  metadata: SignatureMetadata
): Promise<void> {
  if (!fs.existsSync(filePath)) {
    throw new Error(t("error_pdf_missing", { path: filePath }));
  }
  if (!fs.existsSync(certPath)) {
    throw new Error(t("error_cert_missing", { path: certPath }));
  }

  await checkSigningFileSizes(filePath, certPath);
  const pdfBuffer = await fs.promises.readFile(filePath);
  const p12Buffer = await fs.promises.readFile(certPath);

  const signedBuffer = await signPdfBuffer(pdfBuffer, p12Buffer, password, metadata);

  const tempPath = `${filePath}.${randomUUID()}.signed.tmp`;
  try {
    await fs.promises.writeFile(tempPath, signedBuffer, { flag: "wx", mode: 0o600 });
    if (!(await fs.promises.readFile(filePath)).equals(pdfBuffer)) {
      throw new Error(t("error_pdf_changed"));
    }
    await fs.promises.rename(tempPath, filePath);
  } finally {
    await fs.promises.rm(tempPath, { force: true });
  }
}

/** Sign an existing PDF into a new sibling file without replacing the source. */
export async function signPdfCopy(
  filePath: string,
  certPath: string,
  password: string,
  metadata: SignatureMetadata
): Promise<string> {
  if (!fs.existsSync(filePath)) throw new Error(t("error_pdf_missing", { path: filePath }));
  if (!fs.existsSync(certPath)) throw new Error(t("error_cert_missing", { path: certPath }));
  await checkSigningFileSizes(filePath, certPath);
  const original = await fs.promises.readFile(filePath);
  const certificate = await fs.promises.readFile(certPath);
  const signed = await signPdfBuffer(original, certificate, password, metadata);
  if (!(await fs.promises.readFile(filePath)).equals(original)) throw new Error(t("error_pdf_changed"));
  const parsed = path.parse(filePath);
  let output = path.join(parsed.dir, `${parsed.name}.signed.pdf`);
  let handle: fs.promises.FileHandle | undefined;
  try {
    try {
      handle = await fs.promises.open(output, "wx", 0o600);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      output = path.join(parsed.dir, `${parsed.name}.signed-${randomUUID().slice(0, 8)}.pdf`);
      handle = await fs.promises.open(output, "wx", 0o600);
    }
    await handle.writeFile(signed);
    await handle.close();
    handle = undefined;
    return output;
  } catch (error) {
    // Remove only the file whose exclusive creation succeeded in this call.
    if (handle) {
      try { await handle.close(); } finally { await fs.promises.rm(output, { force: true }); }
    }
    throw error;
  }
}
