/**
 * SVG Venn diagram — 3 proportionally-sized circles in a triangular arrangement.
 * Circle radius is scaled by sqrt(reach / maxReach) so area represents audience size.
 * Circles use mix-blend-mode: screen for a clean overlap effect on dark bg.
 */
const COLORS = ['#2563EB', '#7C3AED', '#10B981']
const MAX_R = 110   // max radius in px
const W = 360
const H = 280

export default function VennDiagram({ selected }) {
  if (selected.length !== 3) return null

  const maxReach = Math.max(...selected.map(a => a.reach))

  // Compute radii
  const radii = selected.map(a => Math.max(30, Math.sqrt(a.reach / maxReach) * MAX_R))

  // Fixed triangle positions — top-left, top-right, bottom-center
  // We offset slightly based on relative radius so smaller circles don't get swamped
  const cx = W / 2
  const cy = H / 2
  const spread = 72

  const positions = [
    { x: cx - spread, y: cy - 28 },   // left
    { x: cx + spread, y: cy - 28 },   // right
    { x: cx,          y: cy + 52 },   // bottom
  ]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: 'block', borderRadius: 8 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={W} height={H} fill="#0D0D14" rx="8" />

      {/* Circles with blend mode */}
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
          opacity={0.7}
        />
      ))}

      {/* Labels — placed near edge of each circle away from center */}
      {selected.map((a, i) => {
        const offsets = [
          { dx: -radii[i] * 0.55, dy: -radii[i] * 0.55 },
          { dx:  radii[i] * 0.55, dy: -radii[i] * 0.55 },
          { dx:  0,                dy:  radii[i] * 0.65  },
        ]
        const lx = positions[i].x + offsets[i].dx
        const ly = positions[i].y + offsets[i].dy

        // Truncate long names
        const name = a.affinity.length > 18 ? a.affinity.slice(0, 17) + '…' : a.affinity

        return (
          <g key={`label-${a.id}`}>
            <text
              x={lx}
              y={ly - 6}
              textAnchor="middle"
              fill={COLORS[i]}
              fontSize="11"
              fontWeight="700"
              fontFamily="Inter, sans-serif"
            >
              {name}
            </text>
            <text
              x={lx}
              y={ly + 9}
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
