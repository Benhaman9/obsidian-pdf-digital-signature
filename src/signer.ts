import * as forge from "node-forge";
import { PDFDocument } from "pdf-lib";
import { pdflibAddPlaceholder } from "@signpdf/placeholder-pdf-lib";
import { SignPdf } from "@signpdf/signpdf";
import { P12Signer } from "@signpdf/signer-p12";
import * as fs from "fs";

// Definiciones de tipos para node-forge para eliminar totalmente las advertencias de 'any'
interface ForgeCert {
  validity: {
    notBefore: Date;
    notAfter: Date;
  };
  subject: {
    getField(name: string): { value?: string } | null;
  };
}

interface ForgeSafeBag {
  cert?: ForgeCert;
}

interface ForgeSafeContent {
  safeBags: ForgeSafeBag[];
}

interface ForgePkcs12 {
  safeContents: ForgeSafeContent[];
}

interface ForgeModule {
  asn1: {
    fromDer(bytes: string): unknown;
    toDer(asn1: unknown): { getBytes(): string };
  };
  pkcs12: {
    pkcs12FromAsn1(asn1: unknown, strict?: boolean | string, password?: string): ForgePkcs12;
    toPkcs12Asn1(key: unknown, cert: unknown, password?: string, options?: Record<string, unknown>): unknown;
  };
  pki: {
    rsa: { generateKeyPair(bits: number): { publicKey: unknown; privateKey: unknown } };
    createCertificate(): {
      publicKey: unknown;
      serialNumber: string;
      validity: { notBefore: Date; notAfter: Date };
      setSubject(attrs: Array<{ name: string; value: string }>): void;
      setIssuer(attrs: Array<{ name: string; value: string }>): void;
      setExtensions(exts: Array<Record<string, unknown>>): void;
      sign(key: unknown, md: unknown): void;
    };
  };
  md: {
    sha256: { create(): unknown };
  };
  random: {
    getBytesSync(count: number): string;
  };
  util: {
    bytesToHex(bytes: string): string;
  };
}

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
    
    let p12: ForgePkcs12;
    try {
      p12 = f.pkcs12.pkcs12FromAsn1(p12Asn1, false, password || "");
    } catch {
      p12 = f.pkcs12.pkcs12FromAsn1(p12Asn1, password || "");
    }

    let cert: ForgeCert | null = null;
    for (const safeContent of p12.safeContents) {
      for (const safeBag of safeContent.safeBags) {
        if (safeBag.cert) {
          cert = safeBag.cert;
          break;
        }
      }
      if (cert) break;
    }

    if (!cert) {
      return { exists: true, valid: false, error: "No certificate found inside PFX" };
    }

    const notBefore = cert.validity.notBefore;
    const notAfter = cert.validity.notAfter;
    const now = new Date();

    const diffMs = notAfter.getTime() - now.getTime();
    const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const commonNameAttr = cert.subject.getField("CN");
    const commonName = commonNameAttr && commonNameAttr.value ? String(commonNameAttr.value) : undefined;

    const isExpired = daysRemaining < 0;
    const isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 30;

    return {
      exists: true,
      valid: true,
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
  organization = "Personal / Universidad",
  country = "CL",
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
    { name: "organizationName", value: organization },
    { name: "countryName", value: country },
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

  pdflibAddPlaceholder({
    pdfDoc,
    reason: metadata.reason || "Personal document",
    contactInfo: metadata.contactInfo || "",
    name: metadata.signerName || "Default",
    location: metadata.location || "Chile",
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
    throw new Error(`El archivo PDF no existe: ${filePath}`);
  }
  if (!fs.existsSync(certPath)) {
    throw new Error(`El certificado digital no existe: ${certPath}`);
  }

  const pdfBuffer = await fs.promises.readFile(filePath);
  const p12Buffer = await fs.promises.readFile(certPath);

  const signedBuffer = await signPdfBuffer(pdfBuffer, p12Buffer, password, metadata);

  const tempPath = filePath + ".signed.tmp";
  await fs.promises.writeFile(tempPath, signedBuffer);

  try {
    await fs.promises.rename(tempPath, filePath);
  } catch {
    await fs.promises.unlink(filePath);
    await fs.promises.rename(tempPath, filePath);
  }
}