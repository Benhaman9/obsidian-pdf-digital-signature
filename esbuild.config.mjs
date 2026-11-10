import esbuild from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import { checkCompatibility } from "./scripts/check-api-compatibility.cjs";
import { thirdPartyNotices } from "./scripts/third-party-notices.cjs";
import process from "process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const dependency = createRequire(import.meta.url);
if (dependency("node-forge/package.json").version !== dependency("./package.json").dependencies["node-forge"]) {
  throw new Error("Installed node-forge does not match the pinned package.json. Run npm ci before building.");
}

const root = path.dirname(fileURLToPath(import.meta.url));
const compatibility = checkCompatibility(root);
if (compatibility.findings.length) throw new Error(JSON.stringify(compatibility.findings));
const notices = thirdPartyNotices(root);
writeFileSync(path.join(root, "THIRD-PARTY-NOTICES.txt"), notices);
const licenseBanner = "/*!\n" + readFileSync(path.join(root, "LICENSE"), "utf8").replace(/\r\n/g, "\n") + "\n" + notices.replaceAll("*/", "* /") + "\n*/";

const prod = process.argv[2] === "production";

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  banner: { js: licenseBanner },
  preserveSymlinks: true,
  plugins: [{
    name: "pdf-node-scheduler",
    setup(build) {
      build.onResolve({ filter: /^\.\/async$/ }, args => {
        if (/pdf-lib[\\/]cjs[\\/]utils[\\/]index\.js$/.test(args.importer)) {
          return { path: path.join(path.dirname(fileURLToPath(import.meta.url)), "src/pdf-scheduler.ts") };
        }
      });
    },
  }],
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr"
  ],
  format: "cjs",
  platform: "node",
  target: "es2020",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "main.js"
});

if (prod) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}
