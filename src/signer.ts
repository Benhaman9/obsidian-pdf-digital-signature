import * as forge from "node-forge";
import { PDFDocument } from "pdf-lib";
import { pdflibAddPlaceholder } from "@signpdf/placeholder-pdf-lib";
import { SignPdf } from "@signpdf/signpdf";
import { P12Signer } from "@signpdf/signer-p12";
import * as fs from "fs";

// Helper para compatibilidad CJS / ESM con node-forge
function getForge() {
  const f = (forge as any).default || forge;
  return f;
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
    
    // Intentar abrir con strict false y luego true
    let p12: any;
    try {
      p12 = f.pkcs12.pkcs12FromAsn1(p12Asn1, false, password || "");
    } catch {
      p12 = f.pkcs12.pkcs12FromAsn1(p12Asn1, password || "");
    }

    let cert: any = null;
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
    const commonName = commonNameAttr ? String(commonNameAttr.value) : undefined;

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
  } catch (err: any) {
    return {
      exists: true,
      valid: false,
      error: err.message || "Invalid password or corrupted certificate file",
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
    reason: metadata.reason || "Documento personal / universitario",
    contactInfo: metadata.contactInfo || "",
    name: metadata.signerName || "Benjamín Alcalde G.",
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
