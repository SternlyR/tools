import { useState } from 'react'
import Header from './components/Header'
import AffinityExplorer from './components/AffinityExplorer'
import Pick3Builder from './components/Pick3Builder'
import './App.css'

export default function App() {
  const [selected, setSelected] = useState([])

  function handleSelect(affinity) {
    if (selected.find(a => a.id === affinity.id)) return
    if (selected.length >= 3) return
    setSelected(prev => [...prev, affinity])
  }

  function handleRemove(id) {
    setSelected(prev => prev.filter(a => a.id !== id))
  }

  function handleClear() {
    setSelected([])
  }

  return (
    <div className="app">
      <Header />
      <div className="app-body">
        <AffinityExplorer selected={selected} onSelect={handleSelect} />
        <Pick3Builder selected={selected} onRemove={handleRemove} onClear={handleClear} />
      </div>
    </div>
  )
}
