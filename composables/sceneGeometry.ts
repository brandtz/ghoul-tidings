// Seeded scene geometry, identical on every client. Port of renderVals() in Shell.dc.html.
let cached: ReturnType<typeof build> | null = null

function build() {
  let s = 11
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
  const circ = (x: number, y: number, r: number) => `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`

  let starsD = ''
  for (let i = 0; i < 70; i++) starsD += circ(rnd() * 1920, rnd() * 520, 1 + rnd() * 1.4)
  for (let i = 0; i < 90; i++) { rnd(); rnd(); rnd() } // keeps the seed aligned with the canvas

  const tb = ['', '', '', '', '']; let ti = 0
  for (let x = 30; x <= 520; x += 40) {
    const y = 48 + 26 * Math.sin(x / 60) + (x < 120 ? (120 - x) * 0.5 : 0)
    const c = ti++ % 5
    tb[c] += circ(x, y, 6); tb[c] += circ(1920 - x, y, 6)
  }
  const fb = ['', '', '', '']; let fi = 0
  const X0 = 426; const Y0 = 82; const X1 = 1494; const Y1 = 830
  for (let x = X0 + 30; x <= X1 - 30; x += 46) { const c = fi++ % 4; fb[c] += circ(x, Y0, 6.5); fb[c] += circ(x, Y1, 6.5) }
  for (let y = Y0 + 46; y <= Y1 - 46; y += 46) { const c = fi++ % 4; fb[c] += circ(X0, y, 6.5); fb[c] += circ(X1, y, 6.5) }

  const web = (cx: number, cy: number, sx: number, R: number, angles: number[]) => {
    const f = (r: number, a: number) => [cx + sx * r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)] as const
    let d = angles.map((a) => { const q = f(R, a); return `M${cx} ${cy}L${q[0].toFixed(0)} ${q[1].toFixed(0)}` }).join('')
    ;[0.28, 0.5, 0.74, 1].forEach((fr) => {
      const pts = angles.map(a => f(R * fr, a))
      d += `M${pts[0]![0].toFixed(0)} ${pts[0]![1].toFixed(0)}`
      for (let i = 1; i < pts.length; i++) {
        const mx = (pts[i - 1]![0] + pts[i]![0]) / 2; const my = (pts[i - 1]![1] + pts[i]![1]) / 2
        d += `Q${(mx + (cx - mx) * 0.14).toFixed(0)} ${(my + (cy - my) * 0.14).toFixed(0)} ${pts[i]![0].toFixed(0)} ${pts[i]![1].toFixed(0)}`
      }
    })
    return d
  }

  return {
    starsD,
    tbA: tb[0]!, tbB: tb[1]!, tbC: tb[2]!, tbD: tb[3]!, tbE: tb[4]!,
    fbA: fb[0]!, fbB: fb[1]!, fbC: fb[2]!, fbD: fb[3]!,
    webTR: web(1920, 0, -1, 360, [0, 20, 40, 60, 80, 90]),
    webTL: web(0, 0, 1, 230, [0, 25, 50, 75, 90]),
  }
}

export const sceneGeometry = () => (cached ??= build())
