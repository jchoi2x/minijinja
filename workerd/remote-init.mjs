/**
 * Load MiniJinja WASM for `init()` without importing `minijinja_bg.wasm` from the
 * npm package (keeps the Cloudflare Worker bundle small).
 *
 * @typedef {import("../pkg/workerd/minijinja.js").InitInput} InitInput
 */

/**
 * Example default: GitHub raw file for `pkg/workerd/minijinja_bg.wasm` on `main`.
 * Pass your fork or release URL if different.
 */
export const DEFAULT_MINIJINJA_WASM_URL =
  "https://github.com/jchoi2x/minijinja/raw/refs/heads/main/pkg/workerd/minijinja_bg.wasm";

/**
 * Returns an {@link InitInput} suitable for the wasm-bindgen default `init` export.
 *
 * - With no argument, fetches {@link DEFAULT_MINIJINJA_WASM_URL}.
 * - With a string or `URL`, fetches that location.
 * - With `Response`, `WebAssembly.Module`, or buffer source, returns it unchanged
 *   (for callers that already fetched or compile offline).
 *
 * @param {InitInput | string | URL | undefined} [input]
 * @returns {Promise<InitInput>}
 */
export async function fetchMinijinjaWasmInitInput(input) {
  if (input instanceof WebAssembly.Module) {
    return input;
  }
  if (input instanceof ArrayBuffer) {
    return input;
  }
  if (ArrayBuffer.isView(input)) {
    return input;
  }
  if (typeof Response !== "undefined" && input instanceof Response) {
    return input;
  }
  if (typeof Request !== "undefined" && input instanceof Request) {
    return fetchMinijinjaWasmInitInput(await fetch(input));
  }

  const url =
    input === undefined || input === null
      ? DEFAULT_MINIJINJA_WASM_URL
      : typeof input === "string" || input instanceof URL
        ? String(input)
        : null;

  if (url === null) {
    return /** @type {InitInput} */ (input);
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`minijinja WASM fetch failed: HTTP ${res.status} ${url}`);
  }

  const bytes = await res.arrayBuffer();
  const asWasmResponse = () =>
    new Response(bytes, {
      status: 200,
      headers: { "content-type": "application/wasm" },
    });

  const w = /** @type {typeof WebAssembly & { compile?: (b: ArrayBuffer) => Promise<WebAssembly.Module> }} */ (
    WebAssembly
  );

  if (typeof w.compileStreaming === "function") {
    return w.compileStreaming(asWasmResponse());
  }

  if (typeof w.compile === "function") {
    try {
      return await w.compile(bytes);
    } catch {
      // try instantiateStreaming below
    }
  }

  if (typeof w.instantiateStreaming === "function") {
    return asWasmResponse();
  }

  throw new Error(
    "MiniJinja WASM cannot load in this runtime: need WebAssembly.compileStreaming, " +
      "WebAssembly.compile, or WebAssembly.instantiateStreaming after fetching WASM",
  );
}
