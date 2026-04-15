import { useState } from 'react'
import Header from './components/Header'
import AffinityExplorer from './components/AffinityExplorer'
import Pick3Builder from './components/Pick3Builder'
import './App.css'

export default function App() {
  const [selected, setSelected] = useState([])

  function handleToggle(affinity) {
    const exists = selected.some(a => a.id === affinity.id)
    if (exists) {
      setSelected(prev => prev.filter(a => a.id !== affinity.id))
    } else if (selected.length < 3) {
      setSelected(prev => [...prev, affinity])
    }
  }

  function handleClear() {
    setSelected([])
  }

  return (
    <div className="app">
      <Header />
      <div className="app-body">
        <AffinityExplorer selected={selected} onToggle={handleToggle} />
        <Pick3Builder selected={selected} onToggle={handleToggle} onClear={handleClear} />
      </div>
    </div>
  )
}
