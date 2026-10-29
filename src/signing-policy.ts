import { t, type TranslationKey } from "./i18n";

export type SignatureMode = "approval" | "certify";
export type Jurisdiction = "international" | "CL" | "EU" | "UK" | "US";

export function normalizeSignatureMode(value: unknown): SignatureMode {
  return value === "approval" ? "approval" : "certify";
}

export function normalizeJurisdiction(value: unknown): Jurisdiction {
  return value === "CL" || value === "EU" || value === "UK" || value === "US"
    ? value : "international";
}

export function getJurisdictionGuidance(jurisdiction: Jurisdiction): string {
  const keys: Record<Jurisdiction, TranslationKey> = {
    international: "jurisdiction_international_guidance",
    CL: "jurisdiction_cl_guidance",
    EU: "jurisdiction_eu_guidance",
    UK: "jurisdiction_uk_guidance",
    US: "jurisdiction_us_guidance",
  };
  return t(keys[normalizeJurisdiction(jurisdiction)]);
}
