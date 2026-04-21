import type { InitInput } from "../pkg/workerd/minijinja.js";

export declare const DEFAULT_MINIJINJA_WASM_URL: string;

export declare function fetchMinijinjaWasmInitInput(
  input?: InitInput | string | URL,
): Promise<InitInput>;
