// Guess the Thing image pipeline: sharp cuts six crops, tight to full, around the focal point.
import sharp from 'sharp'
import { db, save, uid, type GuessItem } from './db'
import { loadLocalCatalog } from './codes'
import { hasFile, putFile } from './files'

export async function cutCrops(input: Buffer, focalX: number, focalY: number) {
  const img = sharp(input).rotate()
  const meta = await img.metadata()
  const W = meta.width!; const H = meta.height!
  const paths: string[] = []
  const uploads: Promise<void>[] = []
  for (let i = 0; i < 6; i++) {
    const frac = 0.12 + ((1 - 0.12) * i) / 5
    const w = Math.max(16, Math.round(W * frac))
    const h = Math.min(H, Math.round((w * 9) / 16))
    const left = Math.max(0, Math.min(W - w, Math.round(W * focalX - w / 2)))
    const top = Math.max(0, Math.min(H - h, Math.round(H * focalY - h / 2)))
    const name = `${uid()}.jpg`
    const out = await sharp(input).rotate().extract({ left, top, width: w, height: h }).resize(1280).jpeg({ quality: 82 }).toBuffer()
    uploads.push(putFile(name, out, 'image/jpeg'))
    paths.push(name)
  }
  const full = `${uid()}.jpg`
  uploads.push(putFile(full, await sharp(input).rotate().resize({ width: 1280, withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer(), 'image/jpeg'))
  await Promise.all(uploads)
  return { cropPaths: paths, fullPath: full }
}

const bg = (a: string, b: string) => `<defs><radialGradient id="g" cx=".5" cy=".45" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs><rect width="1600" height="900" fill="url(#g)"/>`

// Original placeholder art, rasterized on first run. Swap for real photos in the admin panel.
const ART: Record<string, string> = {
  candycane: `${bg('#F7E9E4', '#C9B3B0')}<path d="M640 860 V300 a170 170 0 0 1 340 0 V360" fill="none" stroke="#F8F4F2" stroke-width="110" stroke-linecap="round"/><path d="M640 860 V300 a170 170 0 0 1 340 0 V360" fill="none" stroke="#C81E2E" stroke-width="110" stroke-dasharray="70 80"/>`,
  pumpkin: `${bg('#2A1A3E', '#0D0818')}<ellipse cx="800" cy="520" rx="380" ry="290" fill="#E66B1F"/><path d="M620 240 Q540 520 620 800 M980 240 Q1060 520 980 800 M800 230 V810" stroke="#B84A10" stroke-width="16" fill="none"/><path d="M780 240 q10 -90 80 -110 l14 34 q-44 16 -48 80z" fill="#2F7A3A"/><path d="M600 420 l90 50 l-90 50z M1000 420 l-90 50 l90 -50z M580 620 l70 -40 l50 40 l60 -40 l40 40 l60 -40 l50 40 l70 -40 l-30 90 l-90 -30 l-60 40 l-60 -40 l-80 30z" fill="#FFD36B"/>`,
  globe: `${bg('#17324C', '#071120')}<rect x="520" y="660" width="560" height="150" rx="26" fill="#7A3B1E"/><circle cx="800" cy="410" r="300" fill="#BFE3F5" opacity=".55"/><circle cx="800" cy="410" r="300" fill="none" stroke="#F0FAFF" stroke-width="14"/><path d="M800 200 L690 360 H760 L650 500 H950 L840 360 H910Z" fill="#165B43"/><rect x="780" y="500" width="40" height="70" fill="#5A3519"/><ellipse cx="800" cy="600" rx="220" ry="44" fill="#FFFFFF"/><g fill="#FFFFFF"><circle cx="620" cy="300" r="10"/><circle cx="960" cy="260" r="12"/><circle cx="700" cy="480" r="8"/><circle cx="930" cy="440" r="10"/><circle cx="860" cy="210" r="9"/></g>`,
  ornament: `${bg('#143B2E', '#071610')}<rect x="760" y="110" width="80" height="60" rx="8" fill="#D9AA60"/><path d="M800 110 q-40 -70 0 -70 q40 0 0 70" fill="none" stroke="#D9AA60" stroke-width="10"/><circle cx="800" cy="480" r="320" fill="#C81E2E"/><path d="M490 420 Q800 520 1110 420 M482 520 Q800 620 1118 520" stroke="#F2C14E" stroke-width="30" fill="none"/><ellipse cx="680" cy="340" rx="70" ry="44" fill="#FFFFFF" opacity=".35" transform="rotate(-30 680 340)"/>`,
  hat: `${bg('#3C183A', '#120819')}<ellipse cx="800" cy="720" rx="440" ry="80" fill="#17101F"/><path d="M540 700 Q700 300 960 130 Q900 420 1060 700Z" fill="#241530"/><path d="M555 660 Q800 730 1046 660 L1060 700 Q800 770 540 700Z" fill="#8B5CF6"/><rect x="745" y="640" width="110" height="90" rx="10" fill="none" stroke="#F2C14E" stroke-width="16"/>`,
  gingerbread: `${bg('#F2E4CF', '#BFA583')}<g fill="#A65E2E"><circle cx="800" cy="250" r="140"/><rect x="660" y="360" width="280" height="320" rx="100"/><rect x="430" y="400" width="300" height="110" rx="55"/><rect x="870" y="400" width="300" height="110" rx="55"/><rect x="620" y="620" width="130" height="260" rx="60" transform="rotate(14 680 750)"/><rect x="850" y="620" width="130" height="260" rx="60" transform="rotate(-14 920 750)"/></g><g fill="#FFFFFF"><circle cx="750" cy="225" r="16"/><circle cx="850" cy="225" r="16"/><circle cx="800" cy="440" r="16"/><circle cx="800" cy="520" r="16"/></g><path d="M740 300 Q800 350 860 300" stroke="#FFFFFF" stroke-width="12" fill="none" stroke-linecap="round"/>`,
}

export async function ensureSeedImages() {
  const d = db()
  await Promise.all([...(d.guess as (GuessItem & { seedArt?: string })[]).map(async (g) => {
    if (g.fullPath && await hasFile(g.fullPath)) return
    const art = ART[g.seedArt ?? '']
    if (!art) return
    const png = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">${art}</svg>`)).png().toBuffer()
    Object.assign(g, await cutCrops(png, g.focalX, g.focalY))
  }), d.presentations.length ? null : seedDeck()])
  loadLocalCatalog()
  save()
}

// A tiny hand-rolled PDF so presentation mode works before a real deck is uploaded.
async function seedDeck() {
  const pages = [
    ['Thanks for showing up', 'for each other'], ['Team shout-outs', 'Add your recognition slides here'],
    ['Milestones', 'Replace this deck in the Presentation section'], ['Happy holidays', 'Back to the games'],
  ]
  const objs: string[] = []
  const kids = pages.map((_, i) => `${4 + i * 2} 0 R`).join(' ')
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objs[2] = `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'
  pages.forEach(([a, b], i) => {
    const stream = `0.07 0.08 0.16 rg 0 0 960 540 re f 0.95 0.70 0.24 rg BT /F1 54 Tf 80 300 Td (${a}) Tj ET 0.93 0.91 0.97 rg BT /F1 28 Tf 80 240 Td (${b}) Tj ET`
    objs[4 + i * 2] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 960 540] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`
    objs[5 + i * 2] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  })
  let out = '%PDF-1.4\n'
  const offsets: number[] = []
  for (let n = 1; n < objs.length; n++) { offsets[n] = out.length; out += `${n} 0 obj\n${objs[n]}\nendobj\n` }
  const xref = out.length
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n`
  for (let n = 1; n < objs.length; n++) out += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`
  out += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  const name = `${uid()}.pdf`
  await putFile(name, Buffer.from(out, 'latin1'), 'application/pdf')
  db().presentations.push({ id: uid(), title: 'Recognition slides', pdfPath: name, pageCount: pages.length })
}
