import './Header.css'

export default function Header({ theme, onThemeToggle }) {
  const isDark = theme === 'dark'

  return (
    <header className="header">
      <div className="header-logo">
        <svg width="30" height="24" viewBox="0 0 30 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 13 L15 2 L28 13" stroke="#2563EB" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 22 L15 11 L28 22" stroke="#2563EB" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.55"/>
        </svg>
        <span className="header-wordmark">HARD CARRY MEDIA</span>
      </div>

      <div className="header-divider" />

      <div className="header-title">
        <h1>Audience Affinity Builder</h1>
        <p>Global Gen Z Male reach — select 3 affinities to build your target audience</p>
      </div>

      <div className="header-actions">
        <button className="theme-toggle-btn" onClick={onThemeToggle} title="Toggle theme">
          {isDark ? (
            /* Sun icon — switch to light */
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          ) : (
            /* Moon icon — switch to dark */
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {isDark ? 'Light' : 'Dark'}
        </button>
      </div>
    </header>
  )
}
