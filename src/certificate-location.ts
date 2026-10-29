import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { createHash } from "crypto";

export type CertificateLocation = "inside" | "outside" | "unknown";

function isWithin(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

/** Resolve missing leaves through their nearest existing ancestor, including junctions. */
function canonicalPath(candidate: string): string | undefined {
  let current = candidate;
  const suffix: string[] = [];
  while (true) {
    try {
      return path.resolve(fs.realpathSync(current), ...suffix);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") return undefined;
      // A broken symlink exists lexically, but its target cannot be established.
      try { fs.lstatSync(current); return undefined; }
      catch (statError) {
        if ((statError as NodeJS.ErrnoException).code !== "ENOENT") return undefined;
      }
      const parent = path.dirname(current);
      if (parent === current) return undefined;
      suffix.unshift(path.basename(current));
      current = parent;
    }
  }
}

/** Conservative storage guidance; this does not move or modify any file. */
export function certificateLocation(vaultPath: string, candidate: string): CertificateLocation {
  if (!vaultPath || !candidate || !path.isAbsolute(vaultPath) || vaultPath.includes("\0") || candidate.includes("\0")) return "unknown";
  const vault = path.resolve(vaultPath);
  const certificate = path.resolve(vault, candidate);
  if (isWithin(vault, certificate)) return "inside";
  const canonicalVault = canonicalPath(vault);
  const canonicalCertificate = canonicalPath(certificate);
  if (!canonicalVault || !canonicalCertificate) return "unknown";
  return isWithin(canonicalVault, canonicalCertificate) ? "inside" : "outside";
}

/** Per-vault local storage, intentionally created only when the user generates a key. */
export function defaultCertificatePath(vaultPath: string): string {
  if (!vaultPath || !path.isAbsolute(vaultPath) || vaultPath.includes("\0")) throw new Error("An absolute vault path is required");
  const home = os.homedir();
  const bases = process.platform === "win32"
    ? [process.env.LOCALAPPDATA, path.join(home, "AppData", "Local")]
    : process.platform === "darwin"
      ? [path.join(home, "Library", "Application Support")]
      : [process.env.XDG_DATA_HOME, path.join(home, ".local", "share")];
  const resolvedVault = path.resolve(vaultPath);
  const identity = process.platform === "win32" ? resolvedVault.toLowerCase() : resolvedVault;
  const vaultId = createHash("sha256").update(identity).digest("hex");
  for (const base of bases) {
    if (!base || !path.isAbsolute(base)) continue;
    const candidate = path.join(base, "obsidian-pdf-digital-signature", vaultId, "certificate.pfx");
    if (certificateLocation(vaultPath, candidate) === "outside") return candidate;
  }
  throw new Error("Cannot determine a local certificate location outside this vault");
}
