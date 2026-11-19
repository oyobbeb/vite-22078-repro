// Prints the median and range of each variant's rounds, from the lines run.mjs printed.
// usage: node summary.mjs <variant>... < output
import { readFileSync } from 'node:fs'

const rounds = {}
for (const [, label, median] of readFileSync(0, 'utf8').matchAll(/^(\S+): .* median=(\d+)ms$/gm)) {
  ;(rounds[label] ??= []).push(Number(median))
}
for (const label of process.argv.slice(2)) {
  const ms = rounds[label].sort((a, b) => a - b)
  const half = ms.length >> 1
  const median = ms.length % 2 ? ms[half] : (ms[half - 1] + ms[half]) / 2
  console.log(`${label}: rounds=${ms.length} median=${Math.round(median)}ms range=${ms[0]}-${ms.at(-1)}ms`)
}
