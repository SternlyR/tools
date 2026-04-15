import { useState, useMemo } from 'react'
import { AFFINITIES, MACRO_TOPICS, TIER_META } from '../data/affinities'
import './AffinityExplorer.css'

const TIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export default function AffinityExplorer({ selected, onToggle }) {
  const [search,         setSearch]         = useState('')
  const [activeTopic,    setActiveTopic]     = useState('All')
  const [activeTier,     setActiveTier]      = useState(null)   // null = all tiers
  const [sortMode,       setSortMode]        = useState('grouped') // 'grouped' | 'reach'
  const [expandedTopics, setExpandedTopics]  = useState(() => new Set(MACRO_TOPICS))

  const selectedIds = new Set(selected.map(a => a.id))
  const isFull      = selected.length >= 3

  // ── filtered list ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return AFFINITIES.filter(a => {
      const matchTopic  = activeTopic === 'All' || a.macroTopic === activeTopic
      const matchSearch = !q || a.affinity.toLowerCase().includes(q) || a.macroTopic.toLowerCase().includes(q)
      const matchTier   = activeTier === null || a.tier === activeTier
      return matchTopic && matchSearch && matchTier
    })
  }, [search, activeTopic, activeTier])

  // ── sorted / grouped ───────────────────────────────────────────────────
  const flatSorted = useMemo(() =>
    [...filtered].sort((a, b) => b.reach - a.reach),
    [filtered]
  )

  const grouped = useMemo(() => {
    const map = new Map()
    for (const a of filtered) {
      if (!map.has(a.macroTopic)) map.set(a.macroTopic, [])
      map.get(a.macroTopic).push(a)
    }
    return map
  }, [filtered])

  function toggleExpanded(topic) {
    setExpandedTopics(prev => {
      const next = new Set(prev)
      next.has(topic) ? next.delete(topic) : next.add(topic)
      return next
    })
  }

  const visibleTopics = activeTopic === 'All'
    ? [...grouped.keys()]
    : grouped.has(activeTopic) ? [activeTopic] : []

  // ── card renderer ──────────────────────────────────────────────────────
  function AffinityCard({ a, showTopic = false }) {
    const isSelected  = selectedIds.has(a.id)
    const isDisabled  = isFull && !isSelected
    const tierColor   = TIER_META[a.tier]?.color ?? '#64748B'
    const tierLabel   = TIER_META[a.tier]?.label ?? ''
    return (
      <button
        className={`affinity-card${isSelected ? ' selected' : ''}${isDisabled ? ' disabled' : ''}`}
        onClick={() => !isDisabled && onToggle(a)}
        title={isSelected ? `Remove ${a.affinity}` : isDisabled ? 'Remove a selection first' : `Add ${a.affinity}`}
      >
        {isSelected && <span className="card-check">✓</span>}
        <div className="card-tier-dot" style={{ background: tierColor }} />
        <div className="card-body">
          <div className="card-name">{a.affinity}</div>
          {showTopic && <div className="card-topic">{a.macroTopic}</div>}
          <div className="card-meta">
            <span className="card-reach">{a.reach}M</span>
            <span className="card-tier-badge" style={{ color: tierColor }}>
              T{a.tier} · {tierLabel}
            </span>
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="explorer">

      {/* Search */}
      <div className="explorer-search-row">
        <div className="search-wrap">
          <svg className="search-icon" viewBox="0 0 20 20" fill="none">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M15 15l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            className="search-input"
            type="text"
            placeholder="Search affinities…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
        </div>
      </div>

      {/* Macro topic pills */}
      <div className="filter-row">
        <div className="pills-scroll">
          {['All', ...MACRO_TOPICS].map(t => (
            <button
              key={t}
              className={`pill${activeTopic === t ? ' active' : ''}`}
              onClick={() => {
                setActiveTopic(t)
                if (t !== 'All') setExpandedTopics(new Set([t]))
                else setExpandedTopics(new Set(MACRO_TOPICS))
              }}
            >
              {t === 'All' ? 'All Topics' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Tier filter pills + sort toggle */}
      <div className="filter-row filter-row-secondary">
        <div className="pills-scroll">
          <button
            className={`pill pill-sm${activeTier === null ? ' active' : ''}`}
            onClick={() => setActiveTier(null)}
          >
            All Tiers
          </button>
          {TIERS.map(t => (
            <button
              key={t}
              className={`pill pill-sm${activeTier === t ? ' active' : ''}`}
              style={activeTier === t ? {} : { borderColor: TIER_META[t]?.color + '55', color: TIER_META[t]?.color }}
              onClick={() => setActiveTier(activeTier === t ? null : t)}
            >
              <span
                className="pill-dot"
                style={{ background: TIER_META[t]?.color }}
              />
              T{t}
            </button>
          ))}
        </div>

        {/* Sort mode */}
        <div className="sort-toggle">
          <button
            className={`sort-btn${sortMode === 'grouped' ? ' active' : ''}`}
            onClick={() => setSortMode('grouped')}
          >
            Grouped
          </button>
          <button
            className={`sort-btn${sortMode === 'reach' ? ' active' : ''}`}
            onClick={() => setSortMode('reach')}
          >
            By Reach ↓
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="explorer-meta">
        <span>{filtered.length} affinities</span>
        {isFull && <span className="meta-full">Pick 3 full — click a selected card to swap</span>}
      </div>

      {/* Results */}
      <div className="explorer-groups">

        {/* ── Flat / sorted by reach ── */}
        {sortMode === 'reach' && (
          <>
            {flatSorted.length === 0 && (
              <div className="explorer-empty">No affinities match your filters</div>
            )}
            <div className="affinity-grid affinity-grid-flat">
              {flatSorted.map(a => <AffinityCard key={a.id} a={a} showTopic />)}
            </div>
          </>
        )}

        {/* ── Grouped by macro topic ── */}
        {sortMode === 'grouped' && (
          <>
            {visibleTopics.length === 0 && (
              <div className="explorer-empty">No affinities match your filters</div>
            )}
            {visibleTopics.map(topic => {
              const affinities = grouped.get(topic)
              const isExpanded = expandedTopics.has(topic)
              return (
                <div key={topic} className="topic-group">
                  <button className="topic-group-header" onClick={() => toggleExpanded(topic)}>
                    <div className="topic-group-header-left">
                      <span className="topic-group-name">{topic}</span>
                      <span className="topic-group-count">{affinities.length} affinities</span>
                    </div>
                    <svg
                      className={`topic-chevron${isExpanded ? ' open' : ''}`}
                      viewBox="0 0 16 16" fill="none"
                    >
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="affinity-grid">
                      {affinities.map(a => <AffinityCard key={a.id} a={a} />)}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
