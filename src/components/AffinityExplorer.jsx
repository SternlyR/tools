import { useState, useMemo } from 'react'
import { AFFINITIES, MACRO_TOPICS, TIER_META } from '../data/affinities'
import './AffinityExplorer.css'

export default function AffinityExplorer({ selected, onToggle }) {
  const [search, setSearch] = useState('')
  const [activeTopic, setActiveTopic] = useState('All')
  const [expandedTopics, setExpandedTopics] = useState(() => new Set(MACRO_TOPICS))

  const selectedIds = new Set(selected.map(a => a.id))
  const isFull = selected.length >= 3

  const topics = ['All', ...MACRO_TOPICS]

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return AFFINITIES.filter(a => {
      const matchesTopic = activeTopic === 'All' || a.macroTopic === activeTopic
      const matchesSearch = !q || a.affinity.toLowerCase().includes(q) || a.macroTopic.toLowerCase().includes(q)
      return matchesTopic && matchesSearch
    })
  }, [search, activeTopic])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const a of filtered) {
      if (!map.has(a.macroTopic)) map.set(a.macroTopic, [])
      map.get(a.macroTopic).push(a)
    }
    return map
  }, [filtered])

  function toggleTopic(topic) {
    setExpandedTopics(prev => {
      const next = new Set(prev)
      next.has(topic) ? next.delete(topic) : next.add(topic)
      return next
    })
  }

  const visibleTopics = activeTopic === 'All'
    ? [...grouped.keys()]
    : grouped.has(activeTopic) ? [activeTopic] : []

  return (
    <div className="explorer">
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
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
      </div>

      <div className="topic-pills">
        {topics.map(t => (
          <button
            key={t}
            className={`topic-pill${activeTopic === t ? ' active' : ''}`}
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

      <div className="explorer-meta">
        <span>{filtered.length} affinities</span>
        {isFull && <span className="meta-full">Pick 3 full — click any selected to swap</span>}
      </div>

      <div className="explorer-groups">
        {visibleTopics.length === 0 && (
          <div className="explorer-empty">No affinities match "{search}"</div>
        )}
        {visibleTopics.map(topic => {
          const affinities = grouped.get(topic)
          const isExpanded = expandedTopics.has(topic)
          return (
            <div key={topic} className="topic-group">
              <button className="topic-group-header" onClick={() => toggleTopic(topic)}>
                <div className="topic-group-header-left">
                  <span className="topic-group-label">TIER 1</span>
                  <span className="topic-group-name">{topic}</span>
                  <span className="topic-group-count">{affinities.length} affinities</span>
                </div>
                <svg
                  className={`topic-chevron${isExpanded ? ' open' : ''}`}
                  viewBox="0 0 16 16" fill="none"
                >
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {isExpanded && (
                <div className="affinity-grid">
                  {affinities.map(a => {
                    const isSelected = selectedIds.has(a.id)
                    // Disabled only when full AND not already selected
                    const isDisabled = isFull && !isSelected
                    const tierColor = TIER_META[a.tier]?.color ?? '#64748B'
                    const tierLabel = TIER_META[a.tier]?.label ?? ''
                    return (
                      <button
                        key={a.id}
                        className={`affinity-card${isSelected ? ' selected' : ''}${isDisabled ? ' disabled' : ''}`}
                        onClick={() => !isDisabled && onToggle(a)}
                        title={isSelected ? `Remove ${a.affinity}` : isDisabled ? 'Remove a selection first' : `Add ${a.affinity}`}
                      >
                        {isSelected && <span className="card-check">✓</span>}
                        <div className="card-tier-dot" style={{ background: tierColor }} />
                        <div className="card-body">
                          <div className="card-name">{a.affinity}</div>
                          <div className="card-meta">
                            <span className="card-reach">{a.reach}M</span>
                            <span className="card-tier-badge" style={{ color: tierColor }}>T{a.tier} · {tierLabel}</span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
