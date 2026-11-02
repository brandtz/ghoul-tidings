// Guess the Thing answer matching.
export function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bxmas\b/g, 'christmas')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(the|a|an) /, '')
}

export function damerau(a: string, b: string) {
  const d: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) d[i]![0] = i
  for (let j = 0; j <= b.length; j++) d[0]![j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i]![j] = Math.min(d[i]![j]!, d[i - 2]![j - 2]! + 1)
      }
    }
  }
  return d[a.length]![b.length]!
}

export function isMatch(guess: string, accepted: string[]) {
  const g = normalize(guess)
  if (!g) return false
  return accepted.some((raw) => {
    const a = normalize(raw)
    if (a === g) return true
    return 1 - damerau(a, g) / Math.max(a.length, g.length) >= 0.85
  })
}
