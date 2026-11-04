// Copies the js-dos player into public/js-dos. Only the classic DOSBox build is kept:
// Doom needs nothing more, and the DOSBox-X builds would add about 24 MB to every deploy.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const src = resolve('node_modules/js-dos/dist')
const out = resolve('public/js-dos')
if (!existsSync(src)) process.exit(0)
rmSync(out, { recursive: true, force: true })
mkdirSync(resolve(out, 'emulators'), { recursive: true })
for (const f of ['js-dos.js', 'js-dos.css']) cpSync(resolve(src, f), resolve(out, f))
for (const f of ['emulators.js', 'wdosbox.js', 'wdosbox.wasm', 'wlibzip.js', 'wlibzip.wasm']) cpSync(resolve(src, 'emulators', f), resolve(out, 'emulators', f))
