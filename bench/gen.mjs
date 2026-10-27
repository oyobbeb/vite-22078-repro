// Generates 10 local ESM packages (node_modules/fake-0..9) and 2,000 modules
// (100 folders x 20 files) that each import all of them, plus src/entry.js.
import fs from 'node:fs'
import path from 'node:path'

const root = import.meta.dirname
const [folders, filesPerFolder, packages] = [100, 20, 10]

fs.rmSync(path.join(root, 'src'), { recursive: true, force: true })
for (let k = 0; k < packages; k++) {
  const dir = path.join(root, 'node_modules', `fake-${k}`)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: `fake-${k}`, version: '1.0.0', type: 'module', main: 'index.js' }),
  )
  fs.writeFileSync(path.join(dir, 'index.js'), `export default ${k}\n`)
}

const entry = []
for (let d = 0; d < folders; d++) {
  fs.mkdirSync(path.join(root, 'src', `d${d}`), { recursive: true })
  for (let f = 0; f < filesPerFolder; f++) {
    const lines = []
    for (let k = 0; k < packages; k++) lines.push(`import f${k} from 'fake-${k}'`)
    lines.push(`export default ${Array.from({ length: packages }, (_, k) => `f${k}`).join(' + ')}`)
    fs.writeFileSync(path.join(root, 'src', `d${d}`, `m${f}.js`), lines.join('\n') + '\n')
    entry.push(`import m_${d}_${f} from './d${d}/m${f}.js'`)
  }
}
entry.push(`export default ${folders * filesPerFolder}`)
fs.writeFileSync(path.join(root, 'src', 'entry.js'), entry.join('\n') + '\n')
console.log(`generated ${folders * filesPerFolder} modules in ${folders} folders, ${packages} bare imports each`)
