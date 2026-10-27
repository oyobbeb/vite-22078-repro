#!/usr/bin/env bash
# Builds Vite once per variant from a local clone and runs run.mjs against each build:
#   main            unchanged
#   pr-22080        cache key = specifier + importer (vitejs/vite#22080)
#   a-dirname       cache key = specifier + importer's directory
#   b-packagecache  #22080's key, plus packageCache in the resolve options
# usage: bench/run-variants.sh <vite clone at e954a9cda, after pnpm install>
set -euo pipefail

vite_dir=$(cd "$1" && pwd)
bench_dir=$(cd "$(dirname "$0")" && pwd)
file=packages/vite/src/node/external.ts
applied=""

revert() {
  if [ -n "$applied" ]; then
    git -C "$vite_dir" apply -R "$applied"
    applied=""
  fi
}
trap revert EXIT

if ! git -C "$vite_dir" diff --quiet -- "$file"; then
  echo "$file has local changes, start from a clean checkout" >&2
  exit 1
fi

echo "vite $(git -C "$vite_dir" rev-parse --short HEAD), node $(node -v), $(node -p 'require("os").cpus()[0].model')"
node "$bench_dir/gen.mjs"

for variant in main pr-22080 a-dirname b-packagecache; do
  if [ "$variant" != main ]; then
    applied="$bench_dir/patches/$variant.patch"
    git -C "$vite_dir" apply "$applied"
  fi
  # run inside the clone so corepack picks the pnpm version vite pins
  (cd "$vite_dir/packages/vite" && pnpm --silent run build-bundle > /dev/null)
  LABEL=$variant VITE_ENTRY="$vite_dir/packages/vite/dist/node/index.js" node "$bench_dir/run.mjs"
  revert
done
