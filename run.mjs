// usage: node run.mjs <order...>   e.g. `node run.mjs a b`, `node run.mjs b a`, `node run.mjs a`
const { createServer, createServerModuleRunner, version } = await import(process.env.VITE_ENTRY ?? 'vite')
const order = process.argv.slice(2)
const server = await createServer({
  root: import.meta.dirname,
  configFile: false,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, ws: false },
})
const runner = createServerModuleRunner(server.environments.ssr, { hmr: false })
console.log(`vite ${version} (${process.env.VITE_ENTRY ?? "npm"}), node ${process.version}, order: ${order.join(' -> ')}`)
for (const name of order) {
  try {
    const mod = await runner.import(`/src/${name}.js`)
    console.log(`  ${name}:`, JSON.stringify(mod.result))
  } catch (e) {
    console.log(`  ${name}: ERROR ${e.constructor.name}: ${e.message.split('\n')[0]}`)
  }
}
await runner.close()
await server.close()
