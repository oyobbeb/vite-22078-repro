// same as run.mjs but through the legacy server.ssrLoadModule API
const { createServer, version } = await import(process.env.VITE_ENTRY ?? 'vite')
const order = process.argv.slice(2)
const server = await createServer({
  root: import.meta.dirname, configFile: false, logLevel: 'error', appType: 'custom',
  server: { middlewareMode: true, hmr: false, ws: false },
})
console.log(`[ssrLoadModule] vite ${version}, order: ${order.join(' -> ')}`)
for (const name of order) {
  try {
    const mod = await server.ssrLoadModule(`/src/${name}.js`)
    console.log(`  ${name}:`, JSON.stringify(mod.result))
  } catch (e) {
    console.log(`  ${name}: ERROR ${e.constructor.name}: ${e.message.split('\n')[0]}`)
  }
}
await server.close()
