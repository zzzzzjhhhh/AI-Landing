/** Extract the supplied WebHand runtime without importing its Vue application. */
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const source = process.argv[2];
if (!source) throw new Error("Usage: node scripts/glove-pressure/extract-webhand.mjs /path/to/WebHand-package");
const destination = join(dirname(fileURLToPath(import.meta.url)), "vendor");
const bundle = await readFile(join(source, "dist/assets/index-DH2fsitE-en.js"), "utf8");
const match = bundle.match(/,jj=('(?:\\.|[^'\\])*'),Mj=null;/s);
if (!match) throw new Error("Unrecognized WebHand bundle: DataHandler loader was not found");
// The match is a single JavaScript string literal, never the application itself.
const loader = runInNewContext(match[1], Object.create(null), { timeout: 1000 });
if (!loader.includes('findWasmBinary(){return locateFile("DataHandler.wasm")}')) {
  throw new Error("Unexpected DataHandler loader");
}
await mkdir(destination, { recursive: true });
await writeFile(join(destination, "data-handler.cjs"), `// Extracted Emscripten glue. See provenance.json. Do not hand-edit.\nmodule.exports = function createDataHandler(options = {}) {\nreturn new Promise((resolve, reject) => {\nvar module = { exports: {} };\nvar Module = { ...options, noInitialRun: true, onRuntimeInitialized() { resolve(Module); }, onAbort(reason) { reject(new Error(String(reason))); } };\n${loader}\n});\n};\n`);
const files = ["DataHandler.wasm", "DataHandler.data", "Hand_R2.glb", "ColorMapDefault.csv"];
const hashes = {};
for (const name of files) {
  const path = join(source, "dist", name);
  await copyFile(path, join(destination, name));
  hashes[name] = createHash("sha256").update(await readFile(path)).digest("hex");
}
await writeFile(join(destination, "provenance.json"), JSON.stringify({
  sourcePackage: "WebHandThreeDCloudMap_nginx_2026052501_english",
  sourceBundle: "index-DH2fsitE-en.js",
  sourceBundleSha256: createHash("sha256").update(bundle).digest("hex"),
  purpose: "Offline generation of native Rerun right-hand pressure geometry",
  files: hashes,
}, null, 2) + "\n");
console.log(`Extracted DataHandler runtime and right-hand assets to ${destination}`);
