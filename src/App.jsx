import { useState } from 'react'
import Header from './components/Header'
import AffinityExplorer from './components/AffinityExplorer'
import Pick3Builder from './components/Pick3Builder'
import './App.css'

export default function App() {
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
