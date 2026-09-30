import * as forge from "node-forge";
import { PDFDocument, PDFSignature, PDFName, PDFDict } from "pdf-lib";
import { pdflibAddPlaceholder } from "@signpdf/placeholder-pdf-lib";
import { SignPdf } from "@signpdf/signpdf";
import { P12Signer } from "@signpdf/signer-p12";
import * as fs from "fs";
import { randomUUID } from "crypto";
import { t } from "./i18n";

type ForgeModule = typeof forge;

function getForge(): ForgeModule {
  const forgeObject = forge as unknown as { default?: ForgeModule };
  return forgeObject.default || (forge as unknown as ForgeModule);
}

export interface SignatureMetadata {
  signerName: string;
  reason?: string;
  location?: string;
  contactInfo?: string;
}

export interface CertificateInfo {
  exists: boolean;
  valid: boolean;
  commonName?: string;
  notBefore?: Date;
  notAfter?: Date;
  daysRemaining?: number;
  isExpiringSoon?: boolean; // <= 30 días
  isExpired?: boolean;
  error?: string;
}

/**
 * Inspecciona un certificado PKCS#12 (.pfx / .p12) y extrae vigencia y expiración.
 */
export function getCertificateInfo(certPath: string, password = ""): CertificateInfo {
  if (!fs.existsSync(certPath)) {
    return { exists: false, valid: false };
  }

  try {
    const f = getForge();
    const p12Der = fs.readFileSync(certPath).toString("binary");
    const p12Asn1 = f.asn1.fromDer(p12Der);
    
    const p12 = f.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
    // Match the same private key used by P12Signer, rather than the first CA in the chain.
    const bags = p12.safeContents.flatMap((content) => content.safeBags);
    const key = bags.find((bag) => bag.type === f.pki.oids.pkcs8ShroudedKeyBag && bag.key)?.key;
    const cert = key && bags.find((bag) => {
      const publicKey = bag.cert?.publicKey as forge.pki.rsa.PublicKey | undefined;
      return publicKey?.n && publicKey.e && key.n.compareTo(publicKey.n) === 0 && key.e.compareTo(publicKey.e) === 0;
    })?.cert;

    if (!cert) {
      return { exists: true, valid: false, error: t("error_no_signing_cert") };
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
      notBefore,
      notAfter,
      daysRemaining,
      isExpiringSoon,
      isExpired,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Invalid password or corrupted certificate file";
    return {
      exists: true,
      valid: false,
      error: errorMsg,
    };
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
    {
      name: "extKeyUsage",
      clientAuth: true,
      emailProtection: true,
    },
  ]);

  cert.sign(keys.privateKey, f.md.sha256.create());

  const p12Asn1 = f.pkcs12.toPkcs12Asn1(keys.privateKey, cert, password, {
    generateLocalKeyId: true,
    friendlyName: signerName,
    algorithm: "3des",
  });

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
  const signer = new P12Signer(p12Buffer, {
    passphrase: password || "",
  });

  const pdfDoc = await PDFDocument.load(pdfBuffer, {
    ignoreEncryption: false,
  });
  if (pdfDoc.getForm().getFields().some((field) =>
    field instanceof PDFSignature && field.acroField.dict.lookupMaybe(PDFName.of("V"), PDFDict))) {
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

  const rawBytesWithPlaceholder = await pdfDoc.save({
    useObjectStreams: false,
  });

  const signpdfInstance = new SignPdf();
  const signedBuffer = await signpdfInstance.sign(
    Buffer.from(rawBytesWithPlaceholder),
    signer
  );

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

  const pdfBuffer = await fs.promises.readFile(filePath);
  const p12Buffer = await fs.promises.readFile(certPath);

  const signedBuffer = await signPdfBuffer(pdfBuffer, p12Buffer, password, metadata);

  const tempPath = `${filePath}.${randomUUID()}.signed.tmp`;
  try {
    await fs.promises.writeFile(tempPath, signedBuffer, { flag: "wx" });
    if (!(await fs.promises.readFile(filePath)).equals(pdfBuffer)) {
      throw new Error(t("error_pdf_changed"));
    }
    await fs.promises.rename(tempPath, filePath);
  } finally {
    await fs.promises.rm(tempPath, { force: true });
  }
}
