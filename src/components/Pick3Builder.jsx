import { useRef } from 'react'
import { toPng } from 'html-to-image'
import { calculateTAA, calculateCoreAudience, formatReach } from '../utils/calculations'
import { TIER_META } from '../data/affinities'
import VennDiagram from './VennDiagram'
import './Pick3Builder.css'

export default function Pick3Builder({ selected, onRemove, onClear }) {
  const exportRef = useRef(null)
  const isComplete = selected.length === 3
  const taa = isComplete ? calculateTAA(selected) : null
  const core = isComplete ? calculateCoreAudience(selected) : null

  async function handleExport() {
    if (!exportRef.current) return
    try {
      const dataUrl = await toPng(exportRef.current, {
        pixelRatio: 2,
        backgroundColor: '#0D0D14',
      })
      const link = document.createElement('a')
      link.download = 'hardcarry-audience-analysis.png'
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('Export failed', e)
    }
  }

  return (
    <div className="builder">
      <div className="builder-header">
        <h2 className="builder-title">
          <span className="builder-title-badge">PICK 3</span>
          Builder
        </h2>
        {selected.length > 0 && (
          <button className="builder-clear" onClick={onClear}>Clear all</button>
        )}
      </div>

      {/* Slots */}
      <div className="builder-slots">
        {[0, 1, 2].map(i => {
          const a = selected[i]
          return (
            <div key={i} className={`slot${a ? ' filled' : ''}`}>
              <div className="slot-number">{i + 1}</div>
              {a ? (
                <div className="slot-content">
                  <div className="slot-affinity-name">{a.affinity}</div>
                  <div className="slot-affinity-meta">
                    <span className="slot-reach">{a.reach}M</span>
                    <span
                      className="slot-tier"
                      style={{ color: TIER_META[a.tier]?.color }}
                    >
                      Tier {a.tier} · {TIER_META[a.tier]?.label}
                    </span>
                    <span className="slot-topic">{a.macroTopic}</span>
                  </div>
                </div>
              ) : (
                <div className="slot-empty">Select from explorer →</div>
              )}
              {a && (
                <button className="slot-remove" onClick={() => onRemove(a.id)} title="Remove">✕</button>
              )}
            </div>
          )
        })}
      </div>

      {/* Results — shown when 3 selected */}
      {isComplete ? (
        <>
          {/* Exportable card */}
          <div className="export-card" ref={exportRef}>
            <div className="export-card-header">
              <div className="export-logo">
                <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                  <polygon points="16,4 28,14 22,14 16,8 10,14 4,14" fill="#2563EB" />
                  <polygon points="16,13 28,23 22,23 16,17 10,23 4,23" fill="#2563EB" opacity="0.6" />
                </svg>
                <span className="export-logo-text">HARD C<span style={{color:'#2563EB'}}>▲</span>RRY MEDIA</span>
              </div>
              <span className="export-card-label">Audience Analysis</span>
            </div>

            <VennDiagram selected={selected} />

            <div className="export-metrics">
              <div className="metric">
                <div className="metric-value">{formatReach(taa)}</div>
                <div className="metric-label">Total Addressable Audience</div>
                <div className="metric-sub">Everyone in ANY of the 3 affinities</div>
              </div>
              <div className="metric-divider" />
              <div className="metric">
                <div className="metric-value accent">{formatReach(core)}</div>
                <div className="metric-label">Core Audience</div>
                <div className="metric-sub">People who fit ALL 3 affinities</div>
              </div>
            </div>

            <div className="export-affinities">
              {selected.map((a, i) => (
                <div key={a.id} className="export-affinity-row">
                  <span
                    className="export-affinity-dot"
                    style={{ background: ['#2563EB','#7C3AED','#10B981'][i] }}
                  />
                  <span className="export-affinity-name">{a.affinity}</span>
                  <span className="export-affinity-reach">{a.reach}M</span>
                </div>
              ))}
            </div>
          </div>

          <button className="export-btn" onClick={handleExport}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 3v10M6 9l4 4 4-4M4 15h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Export PNG for Slides
          </button>
        </>
      ) : (
        <div className="builder-prompt">
          <div className="builder-prompt-count">
            <span className="count-filled">{selected.length}</span>
            <span className="count-sep">/</span>
            <span className="count-total">3</span>
          </div>
          <p>Select {3 - selected.length} more {3 - selected.length === 1 ? 'affinity' : 'affinities'} to generate your audience analysis</p>
        </div>
      )}
    </div>
  )
}
