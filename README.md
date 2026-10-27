# vite-22078-repro

Reproduction for [vitejs/vite#22078](https://github.com/vitejs/vite/issues/22078).

Two workspace packages import a dependency with the same name, `dep`:

- `pkg-a` uses `dep@1.0.0`, a CommonJS package installed from a tarball (inside `node_modules`)
- `pkg-b` uses `dep@2.0.0`, a linked workspace package (outside `node_modules`)

`dep@2` reports whether Vite transformed it (`import.meta.env` is only defined then).

```sh
pnpm install
node run.mjs a b
node run.mjs b a
```

Output with vite 8.3.5 and Node 24.12.0:

```
$ node run.mjs a
  a: {"depVersion":"1.0.0","depFormat":"cjs"}
$ node run.mjs b
  b: {"depVersion":"2.0.0","loadedBy":"vite (inlined)"}
$ node run.mjs a b
  a: {"depVersion":"1.0.0","depFormat":"cjs"}
  b: {"depVersion":"2.0.0","loadedBy":"node (externalized)"}
$ node run.mjs b a
  b: {"depVersion":"2.0.0","loadedBy":"vite (inlined)"}
  a: ERROR ReferenceError: module is not defined
```

Each package works when loaded alone. Loaded together, the result depends on which one is loaded first. `run-ssrload.mjs` does the same through `server.ssrLoadModule` and gives the same results.

To try a local Vite build: `VITE_ENTRY=/path/to/vite/packages/vite/dist/node/index.js node run.mjs a b`

## Benchmark

`bench/` measures how long a fresh dev server takes to load 2,000 modules (100 folders × 20 files) that each import the same 10 packages through the SSR module runner. It runs five times and prints the median.

`bench/run-variants.sh` builds Vite from a local clone once per variant and runs the benchmark against each build:

| Variant | `processedIds` cache key | Resolve options |
| --- | --- | --- |
| `main` | specifier | unchanged |
| `pr-22080` | specifier + importer | unchanged |
| `a-dirname` | specifier + importer's directory | unchanged |
| `b-packagecache` | specifier + importer | `packageCache: config.packageCache` |

```sh
git clone https://github.com/vitejs/vite.git vite-bench
cd vite-bench
git checkout e954a9cda0b5254be495a937333a0be1b8503d8f
pnpm install
cd ..
git clone https://github.com/oyobbeb/vite-22078-repro.git
vite-22078-repro/bench/run-variants.sh vite-bench
```

The script only touches `packages/vite/src/node/external.ts` and restores it after each variant.
