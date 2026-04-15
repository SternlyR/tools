import './Header.css'

export default function Header() {
  return (
    <header className="header">
      <div className="header-logo">
        {/* HC chevron mark */}
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="16,4 28,14 22,14 16,8 10,14 4,14" fill="#2563EB" />
          <polygon points="16,13 28,23 22,23 16,17 10,23 4,23" fill="#2563EB" opacity="0.6" />
        </svg>
        <div className="header-wordmark">
          <span className="header-wordmark-hard">HARD</span>
          <span className="header-wordmark-carry">C<span className="hc-blue">▲</span>RRY</span>
          <span className="header-wordmark-media">MEDI<span className="hc-blue">▲</span></span>
        </div>
      </div>
      <div className="header-title">
        <h1>Affinity Picker</h1>
        <p>Select 3 affinities to calculate your target audience</p>
      </div>
    </header>
  )
}
