import { useEffect, useState } from 'react'
import Report from './Report.jsx'
import Dashboard from './Dashboard.jsx'
import DnaHelix from './DnaHelix.jsx'
import { findSpikes } from './spikes.js'
import { Activity, ArrowRight, CheckSquare, MessageText, Moon, Pause, Phone, Play, Send, Sun } from './icons.jsx'

function useStats() {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    fetch('/api/reports').then(r => r.json()).then(rows => setStats({
      reports: rows.length,
      districts: new Set(rows.map(r => r.district).filter(Boolean)).size,
      signals: findSpikes(rows).length,
    })).catch(() => {})
  }, [])
  return stats
}

function Home({ go, theme }) {
  const stats = useStats()
  const [paused, setPaused] = useState(false)
  return (
    <>
      <section className="hero">
        <DnaHelix paused={paused} light={theme === 'light'} />
        <div className="hero-scrim" />
        <div className="hero-copy">
          <p className="eyebrow"><span className="pulse-dot" />Pharmacovigilance Programme of India</p>
          <h2>Every side effect<br />is a <em>signal</em>.</h2>
          <p className="lead">Tell us what a medicine did to you, in your own words. Each report joins thousands of
            others, and patterns surface before they become a crisis.</p>
          <div className="hero-ctas">
            <button className="btn-primary" onClick={() => go('report')}>Report a side effect <ArrowRight /></button>
            <button className="btn-ghost" onClick={() => go('dashboard')}><Activity /> Live signal dashboard</button>
          </div>
          <dl className="stats" aria-live="polite">
            <div><dt>Reports logged</dt><dd>{stats ? stats.reports.toLocaleString('en-IN') : '…'}</dd></div>
            <div><dt>Districts</dt><dd>{stats ? stats.districts : '…'}</dd></div>
            <div><dt>Signals flagged</dt><dd className={stats?.signals ? 'hot' : ''}>{stats ? stats.signals : '…'}</dd></div>
          </dl>
        </div>
        <div className="hero-hint">
          <span>Drag to twist · click to send a signal</span>
          <button className="icon-btn" onClick={() => setPaused(p => !p)} aria-label={paused ? 'Play animation' : 'Pause animation'}>
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
        </div>
      </section>

      <div className="home">
        <div className="alert alert-big"><Phone /> Trouble breathing, a swollen face or lips? Don't wait, call <a href="tel:108">108</a> now.</div>

        <h3 className="section-title">Three steps, about a minute</h3>
        <ol className="home-steps">
          <li><MessageText size={28} /><b>Describe it</b><span>Type, speak in Hindi or English, or snap the medicine strip.</span></li>
          <li><CheckSquare size={28} /><b>Check it</b><span>AI fills in the PvPI form for you. Correct anything that's wrong.</span></li>
          <li><Send size={28} /><b>Submit</b><span>Your report reaches India's drug safety programme. Your phone number is never stored.</span></li>
        </ol>

        <div className="official card">
          <div>
            <h3>For health officials</h3>
            <p className="muted">Reports by medicine, district heat map, and automatic spike alerts when a drug's weekly reports double.</p>
          </div>
          <button className="btn-ghost" onClick={() => go('dashboard')}>Open the dashboard <ArrowRight /></button>
        </div>
      </div>
    </>
  )
}

// index.html sets data-theme before first paint (saved choice, else the OS setting)
function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('theme', theme) } catch { /* private mode: choice lasts this visit */ }
  }, [theme])
  return [theme, () => setTheme(t => t === 'dark' ? 'light' : 'dark')]
}

export default function App() {
  const [tab, setTab] = useState('home')
  const [theme, toggleTheme] = useTheme()
  const go = t => { setTab(t); window.scrollTo(0, 0) }
  return (
    <>
      <header className={tab === 'home' ? 'header header-over' : 'header'}>
        <h1><button className="brand" onClick={() => go('home')}><span className="brand-mark" aria-hidden="true" />ADR<span>Signal</span></button></h1>
        <nav aria-label="Main">
          {['home', 'report', 'dashboard'].map(t => (
            <button key={t} className={tab === t ? 'tab active' : 'tab'} aria-current={tab === t ? 'page' : undefined} onClick={() => go(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
          <button className="icon-btn theme-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>
      </header>
      <main key={tab} className={tab === 'home' ? 'page page-home' : 'page'}>
        {tab === 'home' && <Home go={go} theme={theme} />}
        {tab === 'report' && <Report />}
        {tab === 'dashboard' && <Dashboard theme={theme} />}
      </main>
      <footer className="footer">
        Supports India's Pharmacovigilance Programme (PvPI). Not medical advice and does not replace a doctor.
        PvPI helpline 1800-180-3024 · Emergency <a href="tel:108">108</a>
      </footer>
    </>
  )
}
