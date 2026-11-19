#!/usr/bin/env bash
# Builds Vite once per variant from a local clone, then runs run.mjs against each build
# for several rounds and prints the median and range of the rounds:
#   main            unchanged
#   pr-22080        cache key = specifier + importer (vitejs/vite#22080)
#   a-dirname       cache key = specifier + importer's directory
#   b-packagecache  #22080's key, plus packageCache in the resolve options
#   a-localcache    a-dirname, plus a packageCache used only by this check
#   b-localcache    #22080's key, plus a packageCache used only by this check
#   pr-23919        a-localcache, keyed by the directory tryNodeResolve resolves from (vitejs/vite#23919)
# usage: [ROUNDS=10] bench/run-variants.sh <vite clone at e954a9cda, after pnpm install>
set -euo pipefail

vite_dir=$(cd "$1" && pwd)
bench_dir=$(cd "$(dirname "$0")" && pwd)
pkg_dir=$vite_dir/packages/vite
src=packages/vite/src/node
variants=(main pr-22080 a-dirname b-packagecache a-localcache b-localcache pr-23919)
rounds=${ROUNDS:-10}
results=$(mktemp)
applied=""

revert() {
  if [ -n "$applied" ]; then
    git -C "$vite_dir" apply -R "$applied"
    applied=""
  fi
}
cleanup() {
  revert
  for variant in "${variants[@]}"; do
    rm -rf "$pkg_dir/dist-$variant"
  done
  rm -f "$results"
}
trap cleanup EXIT

if ! git -C "$vite_dir" diff --quiet -- "$src"; then
  echo "$src has local changes, start from a clean checkout" >&2
  exit 1
fi

echo "vite $(git -C "$vite_dir" rev-parse --short HEAD), node $(node -v), $(node -p 'require("os").cpus()[0].model')"
node "$bench_dir/gen.mjs"

for variant in "${variants[@]}"; do
  if [ "$variant" != main ]; then
    applied="$bench_dir/patches/$variant.patch"
    git -C "$vite_dir" apply "$applied"
  fi
  # run inside the clone so corepack picks the pnpm version vite pins
  (cd "$pkg_dir" && pnpm --silent run build-bundle > /dev/null)
  # kept next to dist, so the build still finds the package's dependencies
  cp -R "$pkg_dir/dist" "$pkg_dir/dist-$variant"
  revert
done

for ((round = 1; round <= rounds; round++)); do
  for ((i = 0; i < ${#variants[@]}; i++)); do
    # each round starts from a different variant, so none always runs first
    variant=${variants[$(((i + round) % ${#variants[@]}))]}
    LABEL=$variant VITE_ENTRY="$pkg_dir/dist-$variant/node/index.js" node "$bench_dir/run.mjs" | tee -a "$results"
  done
done

echo
node "$bench_dir/summary.mjs" "${variants[@]}" < "$results"
