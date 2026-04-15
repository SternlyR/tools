/**
 * Venn diagram — fixed equilateral triangle layout.
 *
 * Radius clamping (key constraint):
 *   The equilateral triangle can simultaneously guarantee
 *   "no circle engulfs another"  (s > maxR − minR) AND
 *   "centroid inside every circle" (s < minR × √3) only when
 *   the radius ratio ≤ 1 + √3 ≈ 2.73.
 *
 *   We clamp at ratio 2.0 (minAllowed = MAX_R / 2 = 48 px).
 *   This leaves a healthy margin so the classic formula
 *   s = minR × √3 × 0.78 satisfies both constraints for every
 *   possible reach combination.
 *
 * Trade-off: circles smaller than 48 px are drawn slightly larger
 * than strict proportion — but the Venn always shows meaningful
 * three-way overlap, which is the point of the tool.
 */

const COLORS = ['#2563EB', '#7C3AED', '#10B981']
const MAX_R  = 96
const W      = 500
const H      = 310
const PAD    = 55   // space around the circle bounding box for labels

function wrapName(name) {
  if (name.length <= 13) return [name]
  const mid = Math.floor(name.length / 2)
  for (let d = 0; d <= 10; d++) {
    if (mid - d > 0            && name[mid - d] === ' ')
      return [name.slice(0, mid - d), name.slice(mid - d + 1)]
    if (mid + d < name.length  && name[mid + d] === ' ')
      return [name.slice(0, mid + d), name.slice(mid + d + 1)]
  }
  return [name.slice(0, mid), name.slice(mid)]
}

export default function VennDiagram({ selected, theme = 'dark' }) {
  if (selected.length !== 3) return null

  const reaches  = selected.map(a => a.reach)
  const maxReach = Math.max(...reaches)

  // Proportional radii (square-root scale for perceptual area encoding)
  // Clamp: smallest circle must be ≥ MAX_R/2 (50% of the largest).
  // Keeps ratio ≤ 2.0, within the equilateral-triangle guarantee zone.
  const minAllowed = MAX_R / 2
  const radii = reaches.map(r => Math.max(minAllowed, Math.sqrt(r / maxReach) * MAX_R))
  const minR  = Math.min(...radii)

  // ── Triangle geometry ──────────────────────────────────────────────────
  // s = minR × √3 × 0.78  →  centroid at s/√3 = 0.78 × minR < minR
  //   → centroid inside ALL three circles → 3-way overlap guaranteed
  // With ratio ≤ 2 clamping, s > maxR − minR is also guaranteed
  //   → no circle can fully engulf another
  const s    = minR * Math.sqrt(3) * 0.78
  const triH = s * Math.sqrt(3) / 2

  // Local coords centred on (0,0)  — one circle on top, two on bottom
  const local = [
    { x:  0,       y: -triH * (2 / 3) },  // top
    { x: -s / 2,   y:  triH * (1 / 3) },  // bottom-left
    { x:  s / 2,   y:  triH * (1 / 3) },  // bottom-right
  ]
  // Centroid of equilateral triangle centred at origin = (0,0) ✓

  // ── Scale to fit SVG ───────────────────────────────────────────────────
  const bx0 = Math.min(...local.map((p, i) => p.x - radii[i]))
  const bx1 = Math.max(...local.map((p, i) => p.x + radii[i]))
  const by0 = Math.min(...local.map((p, i) => p.y - radii[i]))
  const by1 = Math.max(...local.map((p, i) => p.y + radii[i]))
  const sc  = Math.min((W - 2 * PAD) / (bx1 - bx0), (H - 2 * PAD) / (by1 - by0))

  const ox = W / 2   // local centroid (0,0) maps to SVG centre
  const oy = H / 2

  const positions    = local.map(p => ({ x: p.x * sc + ox, y: p.y * sc + oy }))
  const scaledRadii  = radii.map(r => r * sc)
  const centroid     = { x: ox, y: oy }   // always SVG centre after the transform above

  // ── Theme ──────────────────────────────────────────────────────────────
  const isDark       = theme === 'dark'
  const bgFill       = isDark ? '#0D0D14'               : '#F0F0F8'
  const reachColor   = isDark ? 'rgba(255,255,255,0.82)' : 'rgba(0,0,0,0.72)'
  const blendMode    = isDark ? 'screen'                : 'multiply'
  const fillOpacity  = isDark ? 0.40                    : 0.45

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
          <circle key={a.id}
            cx={positions[i].x} cy={positions[i].y} r={scaledRadii[i]}
            fill={COLORS[i]} opacity={fillOpacity} />
        ))}
      </g>

      {/* Outlines */}
      {selected.map((a, i) => (
        <circle key={`out-${a.id}`}
          cx={positions[i].x} cy={positions[i].y} r={scaledRadii[i]}
          fill="none" stroke={COLORS[i]} strokeWidth={1.5} opacity={0.8} />
      ))}

      {/* Labels — placed in each circle's outer (exclusive) zone */}
      {selected.map((a, i) => {
        // Direction: from centroid toward this circle's centre
        const dx  = positions[i].x - centroid.x
        const dy  = positions[i].y - centroid.y
        const len = Math.sqrt(dx * dx + dy * dy) || 1
        const nx  = dx / len
        const ny  = dy / len

        // 58% of the way from centre to rim, in the outward direction
        const lx     = positions[i].x + nx * scaledRadii[i] * 0.58
        const ly     = positions[i].y + ny * scaledRadii[i] * 0.58
        const lines  = wrapName(a.affinity)
        const lineH  = 13
        const startY = ly - (lines.length * lineH + lineH + 2) / 2 + lineH / 2

        return (
          <g key={`lbl-${a.id}`}>
            {lines.map((line, li) => (
              <text key={li}
                x={lx} y={startY + li * lineH}
                textAnchor="middle" dominantBaseline="middle"
                fill={COLORS[i]} fontSize="10.5" fontWeight="700"
                fontFamily="Inter, system-ui, sans-serif">
                {line}
              </text>
            ))}
            <text
              x={lx} y={startY + lines.length * lineH + 2}
              textAnchor="middle" dominantBaseline="middle"
              fill={reachColor} fontSize="11" fontWeight="600"
              fontFamily="Inter, system-ui, sans-serif">
              {a.reach}M
            </text>
          </g>
        )
      })}
    </svg>
  )
}
