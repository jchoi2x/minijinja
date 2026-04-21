# MiniJinja WASM Package

This repository is a fork of [MiniJinja](https://github.com/mitsuhiko/minijinja), optimized to run on Cloudflare Workers (`workerd`) while still publishing WASM builds for multiple runtime targets.

## Build

1. [Install wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)
2. Run:

```bash
pnpm build
```

This produces:

- `pkg-web` (`wasm-pack --target web`)
- `pkg-node` (`wasm-pack --target nodejs`)
- `pkg-workerd` (`wasm-pack --target bundler`)

## Runtime entrypoints

The package exports runtime-specific entrypoints:

- default import resolves by conditions (`workerd`, `node`, `browser`)
- explicit subpaths: `@jchoi2x/minijinja/web`, `@jchoi2x/minijinja/node`, `@jchoi2x/minijinja/workerd`

## Cloudflare Workers (workerd)

```ts
import initMiniJinja, { create_env } from "@jchoi2x/minijinja/workerd";
import wasm from "@jchoi2x/minijinja/minijinja_bg.wasm";

await initMiniJinja(wasm);
const env = create_env({ "hello.j2": "Hello {{ name }}!" });
const output = env.render("hello.j2", { name: "Workers" });
```
