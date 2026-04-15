/**
 * SVG Venn diagram — 3 proportionally-sized circles in a triangular arrangement.
 * Radius is sqrt-scaled so area ∝ audience size.
 * Labels are placed in the exclusive (non-overlapping) zone of each circle
 * and word-wrapped to prevent edge clipping.
 */
const COLORS = ['#2563EB', '#7C3AED', '#10B981']
const MAX_R = 108
const W = 520
const H = 330

// Label anchor points — fixed safe positions in each circle's exclusive zone,
// far enough from SVG edges that even long wrapped names stay within bounds.
const LABEL_POS = [
  { x: 120, y: 100 }, // left circle  → upper-left safe zone
  { x: 400, y: 100 }, // right circle → upper-right safe zone
  { x: 260, y: 295 }, // bottom circle → lower-center safe zone
]

// Break a name into 1–2 lines, splitting near the midpoint on a space.
function wrapName(name) {
  const MAX = 16
  if (name.length <= MAX) return [name]
  const mid = Math.floor(name.length / 2)
  for (let d = 0; d <= 8; d++) {
    if (name[mid - d] === ' ') return [name.slice(0, mid - d), name.slice(mid - d + 1)]
    if (name[mid + d] === ' ') return [name.slice(0, mid + d), name.slice(mid + d + 1)]
  }
  // No good split found — hard-truncate
  return [name.slice(0, MAX - 1) + '…']
}

export default function VennDiagram({ selected }) {
  if (selected.length !== 3) return null

  const maxReach = Math.max(...selected.map(a => a.reach))
  const radii = selected.map(a => Math.max(28, Math.sqrt(a.reach / maxReach) * MAX_R))

  const positions = [
    { x: 172, y: 150 }, // left
    { x: 348, y: 150 }, // right
    { x: 260, y: 230 }, // bottom
  ]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: 'block', borderRadius: 8 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={W} height={H} fill="#0D0D14" rx="8" />

      {/* Filled circles with screen blend for visible overlaps */}
      <g style={{ mixBlendMode: 'screen' }}>
        {selected.map((a, i) => (
          <circle
            key={a.id}
            cx={positions[i].x}
            cy={positions[i].y}
            r={radii[i]}
            fill={COLORS[i]}
            opacity={0.38}
          />
        ))}
      </g>

      {/* Circle outlines */}
      {selected.map((a, i) => (
        <circle
          key={`outline-${a.id}`}
          cx={positions[i].x}
          cy={positions[i].y}
          r={radii[i]}
          fill="none"
          stroke={COLORS[i]}
          strokeWidth={1.5}
          opacity={0.75}
        />
      ))}

      {/* Labels — anchored at safe fixed positions, word-wrapped */}
      {selected.map((a, i) => {
        const lines = wrapName(a.affinity)
        const lx = LABEL_POS[i].x
        const ly = LABEL_POS[i].y
        const lineHeight = 14

        return (
          <g key={`label-${a.id}`}>
            {lines.map((line, li) => (
              <text
                key={li}
                x={lx}
                y={ly + li * lineHeight}
                textAnchor="middle"
                fill={COLORS[i]}
                fontSize="11"
                fontWeight="700"
                fontFamily="Inter, sans-serif"
              >
                {line}
              </text>
            ))}
            <text
              x={lx}
              y={ly + lines.length * lineHeight + 2}
              textAnchor="middle"
              fill="rgba(255,255,255,0.7)"
              fontSize="11"
              fontWeight="600"
              fontFamily="Inter, sans-serif"
            >
              {a.reach}M
            </text>
          </g>
        )
      })}
    </svg>
  )
}
