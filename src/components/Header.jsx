import './Header.css'

export default function Header() {
  return (
    <header className="header">
      <div className="header-logo">
        {/* Double-chevron mark — two open V strokes, HC brand style */}
        <svg width="30" height="24" viewBox="0 0 30 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 13 L15 2 L28 13" stroke="#2563EB" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 22 L15 11 L28 22" stroke="#2563EB" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.55"/>
        </svg>
        <span className="header-wordmark">HARD CARRY MEDIA</span>
      </div>

      <div className="header-divider" />

      <div className="header-title">
        <h1>Audience Affinity Builder</h1>
        <p>Select 3 affinities to calculate your target audience</p>
      </div>
    </header>
  )
}
