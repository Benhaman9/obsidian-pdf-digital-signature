import esbuild from "esbuild";
import process from "process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const dependency = createRequire(import.meta.url);
if (dependency("node-forge/package.json").version !== dependency("./package.json").dependencies["node-forge"]) {
  throw new Error("Installed node-forge does not match the pinned package.json. Run npm ci before building.");
}

const prod = process.argv[2] === "production";

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
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
