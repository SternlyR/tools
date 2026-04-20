import { useState } from 'react'
import Header from './components/Header'
import AffinityExplorer from './components/AffinityExplorer'
import Pick3Builder from './components/Pick3Builder'
import './App.css'

const CORRECT_PASSWORD = 'hcmadmin'

function PasswordGate({ onUnlock }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (value === CORRECT_PASSWORD) {
      sessionStorage.setItem('hcm_auth', '1')
      onUnlock()
    } else {
      setError(true)
      setValue('')
    }
  }

  return (
    <div className="gate">
      <div className="gate-card">
        <div className="gate-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M6 22 L16 10 L26 22" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M6 15 L16 3 L26 15" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <span className="gate-brand">HARD CARRY MEDIA</span>
        </div>
        <h1 className="gate-title">Audience Affinity Builder</h1>
        <form onSubmit={handleSubmit} className="gate-form">
          <input
            className={`gate-input${error ? ' gate-input-error' : ''}`}
            type="password"
            placeholder="Enter password"
            value={value}
            autoFocus
            onChange={e => { setValue(e.target.value); setError(false) }}
          />
          {error && <p className="gate-error">Incorrect password</p>}
          <button className="gate-btn" type="submit">Enter</button>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  const [unlocked, setUnlocked]   = useState(() => sessionStorage.getItem('hcm_auth') === '1')
  const [selected, setSelected]   = useState([])
  const [appTheme, setAppTheme]   = useState('dark')

  function handleToggle(affinity) {
    const exists = selected.some(a => a.id === affinity.id)
    if (exists) {
      setSelected(prev => prev.filter(a => a.id !== affinity.id))
    } else if (selected.length < 3) {
      setSelected(prev => [...prev, affinity])
    }
  }

  function handleClear() { setSelected([]) }

  function toggleTheme() {
    setAppTheme(t => t === 'dark' ? 'light' : 'dark')
  }

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />

  return (
    <div className="app" data-theme={appTheme}>
      <Header theme={appTheme} onThemeToggle={toggleTheme} />
      <div className="app-body">
        <AffinityExplorer selected={selected} onToggle={handleToggle} />
        <Pick3Builder selected={selected} onToggle={handleToggle} onClear={handleClear} />
      </div>
    </div>
  )
}
