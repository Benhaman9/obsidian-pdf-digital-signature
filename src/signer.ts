import * as forge from "node-forge";
import { PDFDocument } from "pdf-lib";
import { pdflibAddPlaceholder } from "@signpdf/placeholder-pdf-lib";
import { SignPdf } from "@signpdf/signpdf";
import { P12Signer } from "@signpdf/signer-p12";
import * as fs from "fs";
import * as path from "path";

export interface SignatureMetadata {
  signerName: string;
  reason?: string;
  location?: string;
  contactInfo?: string;
}

/**
 * Generates a self-signed X.509 certificate in PKCS#12 (.pfx / .p12) format in pure JavaScript.
 */
export function createSelfSignedCertificate(
  signerName: string,
  password: string,
  organization = "Personal / Universidad",
  country = "CL",
  validityYears = 3
): Buffer {
  const pki = forge.pki;
  const keys = pki.rsa.generateKeyPair(2048);
  const cert = pki.createCertificate();

  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01" + forge.util.bytesToHex(forge.random.getBytesSync(15));

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

  cert.sign(keys.privateKey, forge.md.sha256.create());

  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, cert, password, {
    generateLocalKeyId: true,
    friendlyName: signerName,
    algorithm: "3des",
  });

  const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
  return Buffer.from(p12Der, "binary");
}

/**
 * Digitally signs a PDF Buffer with an X.509 PKCS#12 (.pfx) certificate using pure JavaScript.
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
 * Digitally signs a PDF file on disk in-place.
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
    // En Windows a veces rename sobre archivo existente requiere unlink previo
    await fs.promises.unlink(filePath);
    await fs.promises.rename(tempPath, filePath);
  }
}
