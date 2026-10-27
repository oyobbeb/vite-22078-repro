// Loads src/entry.js through a fresh SSR module runner five times and prints the median.
// usage: VITE_ENTRY=/path/to/vite/packages/vite/dist/node/index.js LABEL=name node run.mjs
if (!process.env.VITE_ENTRY) throw new Error('set VITE_ENTRY to a built vite dist/node/index.js')
const { createServer, createServerModuleRunner } = await import(process.env.VITE_ENTRY)

const times = []
for (let i = 0; i < 5; i++) {
  const server = await createServer({
    root: import.meta.dirname,
    configFile: false,
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, ws: false },
  })
  const runner = createServerModuleRunner(server.environments.ssr, { hmr: false })
  const start = performance.now()
  await runner.import('/src/entry.js')
  times.push(performance.now() - start)
  await runner.close()
  await server.close()
}
times.sort((a, b) => a - b)
console.log(`${process.env.LABEL ?? 'vite'}: runs(ms)=${times.map((t) => t.toFixed(0)).join(',')} median=${times[2].toFixed(0)}ms`)
