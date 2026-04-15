/**
 * Calculate Total Addressable Audience (TAA) using tier-based overlap logic.
 * The smallest affinity's size determines which overlap formula to apply.
 *
 * Tier 8–10 (smallest >= 500M): mainstream, heavy overlap
 *   TAA = largest + (medium × 0.15) + (smallest × 0.10)
 *
 * Tier 5–7 (smallest >= 200M): mid-size, moderate overlap
 *   TAA = largest + (medium × 0.35) + (smallest × 0.25)
 *
 * Tier 1–4 (smallest < 200M): niche, low overlap
 *   TAA = largest + (medium × 0.60) + (smallest × 0.50)
 *
 * Verified: Console & PC Gaming (650) + Movies & Cinema (450) + Streamer Culture (270)
 *   → smallest=270 ≥ 200 → 650 + (450×0.35) + (270×0.25) = 650 + 157.5 + 67.5 = 875M ✓
 */
export function calculateTAA(selected) {
  if (selected.length !== 3) return null
  const [largest, medium, smallest] = [...selected].map(a => a.reach).sort((a, b) => b - a)

  let taa
  if (smallest >= 500) {
    taa = largest + medium * 0.15 + smallest * 0.10
  } else if (smallest >= 200) {
    taa = largest + medium * 0.35 + smallest * 0.25
  } else {
    taa = largest + medium * 0.60 + smallest * 0.50
  }

  return Math.round(taa * 10) / 10
}

/**
 * Core Audience = midpoint of 10–20% of the smallest affinity.
 * These are people who fit ALL three affinities simultaneously.
 */
export function calculateCoreAudience(selected) {
  if (selected.length !== 3) return null
  const smallest = Math.min(...selected.map(a => a.reach))
  return Math.round(smallest * 0.15 * 10) / 10
}

/**
 * Format a reach number (in millions) for display.
 * e.g. 875 → "875M", 1050 → "1.05B"
 */
export function formatReach(val) {
  if (val == null) return '—'
  if (val >= 1000) return `${(val / 1000).toFixed(2).replace(/\.?0+$/, '')}B`
  return `${val}M`
}
