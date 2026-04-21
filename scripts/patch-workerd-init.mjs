/**
 * wasm-pack `--target web` emits `init()` that loads sibling WASM via
 * `new URL('minijinja_bg.wasm', import.meta.url)`, which forces bundlers to
 * embed the binary. For Cloudflare Workers we want JS-only in the bundle and
 * load WASM at runtime from a URL (or other InitInput).
 *
 * This script replaces that default with a clear error so `init()` must be
 * called with an explicit URL, Response, Module, bytes, etc.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(__dirname, "..", "pkg", "workerd", "minijinja.js");

const REPLACEMENT = `    if (module_or_path === undefined) {
        throw new Error(
            "@jchoi2x/minijinja: the workerd build does not embed WASM (see README: Cloudflare Workers). " +
            "Call init with a URL or InitInput, or use fetchMinijinjaWasmInitInput from " +
            "@jchoi2x/minijinja/workerd/remote-init."
        );
    }`;

function main() {
  let src = fs.readFileSync(target, "utf8");
  const pattern =
    /if \(module_or_path === undefined\) \{\s*module_or_path = new URL\('minijinja_bg\.wasm', import\.meta\.url\);\s*\}/;

  if (src.includes("does not embed WASM")) {
    return;
  }

  if (!pattern.test(src)) {
    throw new Error(
      `[patch-workerd-init] Expected default WASM URL block not found in ${target}. ` +
        "wasm-pack output may have changed; update the regex in scripts/patch-workerd-init.mjs.",
    );
  }

  src = src.replace(pattern, REPLACEMENT);
  fs.writeFileSync(target, src, "utf8");
  console.log(`[patch-workerd-init] Patched ${target}`);
}

main();
