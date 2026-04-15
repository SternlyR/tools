/**
 * Venn diagram with geometry-driven circle positions.
 *
 * Circle radii are sqrt-scaled so area ∝ audience size.
 * Center distances are derived from pairwise overlap fractions so that very
 * different audiences (e.g. 850M vs 100M) show as barely-touching circles
 * while similar audiences show meaningful overlap.
 * Positions are solved via the law of cosines, then scaled to fit the SVG.
 * Labels are placed in each circle's exclusive (outer) zone and word-wrapped.
 */

const COLORS = ['#2563EB', '#7C3AED', '#10B981']
const MAX_R  = 96    // max radius (pixels) before any fit-scaling
const W      = 500
const H      = 310
const PAD    = 52    // padding reserved for labels around the diagram

// ─── helpers ────────────────────────────────────────────────────────────────

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

/**
 * Fraction of the SMALLER circle that visually overlaps with the larger.
 * Based on the minimum reach of the pair — mirrors the TAA overlap tiers.
 */
function overlapFraction(reach1, reach2) {
  const minR  = Math.min(reach1, reach2)
  const ratio = Math.min(reach1, reach2) / Math.max(reach1, reach2)
  if (minR >= 500)  return 0.55   // both universal
  if (minR >= 200)  return 0.40   // both substantial
  if (ratio >= 0.5) return 0.28   // similarly-sized niches
  if (ratio >= 0.2) return 0.15   // moderately different
  return 0                        // very different → tangent (barely touching)
}

/** Desired pixel distance between two circle centres. */
function centerDist(r1, reach1, r2, reach2) {
  const ov   = overlapFraction(reach1, reach2)
  const minR = Math.min(r1, r2)
  return Math.max(2, r1 + r2 - ov * 2 * minR)
}

/**
 * Split an affinity name into 1–2 display lines.
 * Splits near the midpoint on a word boundary; never truncates.
 */
function wrapName(name) {
  if (name.length <= 13) return [name]
  const mid = Math.floor(name.length / 2)
  for (let d = 0; d <= 10; d++) {
    if (mid - d > 0       && name[mid - d] === ' ')
      return [name.slice(0, mid - d), name.slice(mid - d + 1)]
    if (mid + d < name.length && name[mid + d] === ' ')
      return [name.slice(0, mid + d), name.slice(mid + d + 1)]
  }
  // No word boundary near middle — force-split at midpoint
  return [name.slice(0, mid), name.slice(mid)]
}

// ─── layout ─────────────────────────────────────────────────────────────────

function computeLayout(selected) {
  const reaches = selected.map(a => a.reach)
  const maxReach = Math.max(...reaches)

  // Radii in abstract pixels (before fit-scaling)
  const radii = reaches.map(r => Math.max(20, Math.sqrt(r / maxReach) * MAX_R))

  // Pairwise centre distances
  const d01 = centerDist(radii[0], reaches[0], radii[1], reaches[1])
  const d02 = centerDist(radii[0], reaches[0], radii[2], reaches[2])
  const d12 = centerDist(radii[1], reaches[1], radii[2], reaches[2])

  // Place circle 0 at origin, circle 1 along +x axis
  // Circle 2 solved via law of cosines at vertex 0
  const cos0 = clamp((d01 * d01 + d02 * d02 - d12 * d12) / (2 * d01 * d02), -1, 1)
  const sin0 = Math.sqrt(1 - cos0 * cos0)

  const local = [
    { x: 0,             y: 0 },
    { x: d01,           y: 0 },
    { x: d02 * cos0,    y: d02 * sin0 },
  ]

  // Bounding box of all circles in local space
  const bx0 = Math.min(...local.map((p, i) => p.x - radii[i]))
  const bx1 = Math.max(...local.map((p, i) => p.x + radii[i]))
  const by0 = Math.min(...local.map((p, i) => p.y - radii[i]))
  const by1 = Math.max(...local.map((p, i) => p.y + radii[i]))

  const bw = bx1 - bx0
  const bh = by1 - by0

  // Scale to fit inside PAD-padded SVG (never upscale)
  const s = Math.min(1, (W - 2 * PAD) / bw, (H - 2 * PAD) / bh)

  // Centre within SVG
  const ox = PAD + (W - 2 * PAD - bw * s) / 2 - bx0 * s
  const oy = PAD + (H - 2 * PAD - bh * s) / 2 - by0 * s

  const positions    = local.map(p => ({ x: p.x * s + ox, y: p.y * s + oy }))
  const scaledRadii  = radii.map(r => r * s)

  return { positions, scaledRadii }
}

// ─── component ──────────────────────────────────────────────────────────────

export default function VennDiagram({ selected, theme = 'dark' }) {
  if (selected.length !== 3) return null

  const { positions, scaledRadii } = computeLayout(selected)
  const isDark = theme === 'dark'

  const bgFill      = isDark ? '#0D0D14'              : '#F0F0F8'
  const reachColor  = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.75)'
  const blendMode   = isDark ? 'screen'               : 'multiply'
  const fillOpacity = isDark ? 0.40                   : 0.45

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      overflow="visible"
      style={{ display: 'block', borderRadius: 8 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={W} height={H} fill={bgFill} rx="8" />

      {/* Filled circles */}
      <g style={{ mixBlendMode: blendMode }}>
        {selected.map((a, i) => (
          <circle
            key={a.id}
            cx={positions[i].x}
            cy={positions[i].y}
            r={scaledRadii[i]}
            fill={COLORS[i]}
            opacity={fillOpacity}
          />
        ))}
      </g>

      {/* Outlines */}
      {selected.map((a, i) => (
        <circle
          key={`out-${a.id}`}
          cx={positions[i].x}
          cy={positions[i].y}
          r={scaledRadii[i]}
          fill="none"
          stroke={COLORS[i]}
          strokeWidth={1.5}
          opacity={0.8}
        />
      ))}

      {/* Labels — placed in the exclusive (outer) zone of each circle */}
      {selected.map((a, i) => {
        // Direction from the centroid of the OTHER two circles toward this one
        const j = (i + 1) % 3, k = (i + 2) % 3
        const ocx = (positions[j].x + positions[k].x) / 2
        const ocy = (positions[j].y + positions[k].y) / 2
        const dx  = positions[i].x - ocx
        const dy  = positions[i].y - ocy
        const len = Math.sqrt(dx * dx + dy * dy) || 1
        const nx  = dx / len
        const ny  = dy / len

        // Place label at 62% toward outer rim of circle
        const lx = positions[i].x + nx * scaledRadii[i] * 0.62
        const ly = positions[i].y + ny * scaledRadii[i] * 0.62

        const lines      = wrapName(a.affinity)
        const lineH      = 13
        const totalH     = lines.length * lineH + lineH + 2   // name lines + reach
        const startY     = ly - totalH / 2 + lineH / 2

        return (
          <g key={`lbl-${a.id}`}>
            {lines.map((line, li) => (
              <text
                key={li}
                x={lx}
                y={startY + li * lineH}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={COLORS[i]}
                fontSize="10.5"
                fontWeight="700"
                fontFamily="Inter, system-ui, sans-serif"
              >
                {line}
              </text>
            ))}
            <text
              x={lx}
              y={startY + lines.length * lineH + 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={reachColor}
              fontSize="11"
              fontWeight="600"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {a.reach}M
            </text>
          </g>
        )
      })}
    </svg>
  )
}
