import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { calculateTAA, calculateCoreAudience, formatReach } from '../utils/calculations'
import { TIER_META } from '../data/affinities'
import VennDiagram from './VennDiagram'
import './Pick3Builder.css'

export default function Pick3Builder({ selected, onToggle, onClear }) {
  const exportRef = useRef(null)
  const [exportTheme, setExportTheme] = useState('dark')

  const isComplete = selected.length === 3
  const taa  = isComplete ? calculateTAA(selected) : null
  const core = isComplete ? calculateCoreAudience(selected) : null

  const isDark = exportTheme === 'dark'

  async function handleExport() {
    if (!exportRef.current) return
    try {
      const dataUrl = await toPng(exportRef.current, {
        pixelRatio: 2,
        backgroundColor: isDark ? '#0D0D14' : '#FFFFFF',
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
                    <span className="slot-tier" style={{ color: TIER_META[a.tier]?.color }}>
                      Tier {a.tier} · {TIER_META[a.tier]?.label}
                    </span>
                    <span className="slot-topic">{a.macroTopic}</span>
                  </div>
                </div>
              ) : (
                <div className="slot-empty">Select from explorer</div>
              )}
              {a && (
                <button className="slot-remove" onClick={() => onToggle(a)} title="Remove">✕</button>
              )}
            </div>
          )
        })}
      </div>

      {isComplete ? (
        <>
          {/* Theme toggle for export */}
          <div className="theme-toggle-row">
            <span className="theme-toggle-label">Export style</span>
            <div className="theme-toggle">
              <button
                className={`theme-btn${exportTheme === 'dark' ? ' active' : ''}`}
                onClick={() => setExportTheme('dark')}
              >
                Dark
              </button>
              <button
                className={`theme-btn${exportTheme === 'light' ? ' active' : ''}`}
                onClick={() => setExportTheme('light')}
              >
                Light
              </button>
            </div>
          </div>

          {/* Exportable card */}
          <div
            className={`export-card ${isDark ? 'export-dark' : 'export-light'}`}
            ref={exportRef}
          >
            <div className="export-card-header">
              <div className="export-logo">
                <svg width="20" height="16" viewBox="0 0 30 24" fill="none">
                  <path d="M2 13 L15 2 L28 13" stroke="#2563EB" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 22 L15 11 L28 22" stroke="#2563EB" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.55"/>
                </svg>
                <span className="export-logo-text">HARD CARRY MEDIA</span>
              </div>
              <span className="export-card-subtitle">AUDIENCE ANALYSIS</span>
            </div>

            <VennDiagram selected={selected} theme={exportTheme} />

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
                  <span className="export-affinity-dot" style={{ background: ['#2563EB','#7C3AED','#10B981'][i] }} />
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
