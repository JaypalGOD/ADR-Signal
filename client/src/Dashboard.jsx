import { useEffect, useState } from 'react'
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { findSpikes, toTime } from './spikes.js'

ChartJS.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, LineElement, PointElement, Tooltip)

const DAY = 86400000
// India Standard Time (UTC+5:30, no daylight saving): shift, then read the UTC fields as IST wall time
const ist = ms => new Date(ms + 5.5 * 3600000).toISOString()
const SEVERITIES = ['mild', 'moderate', 'severe']
const countBy = (rows, key) => rows.reduce((m, r) => { const k = key(r); if (k) m[k] = (m[k] || 0) + 1; return m }, {})
const shade = (n, light) => !n ? (light ? '#e3ebe7' : '#16241f') : n >= 20 ? '#7a1712' : n >= 10 ? '#b42318' : n >= 5 ? '#e8634f' : n >= 2 ? '#f4a28c' : '#fbd5c8'

export default function Dashboard({ theme }) {
  const light = theme === 'light'
  // Chart text/grid follow the theme; react-chartjs-2 re-applies options on change
  const ink = light ? '#4a5f56' : '#94aaa1', grid = light ? '#dbe7e1' : '#1c2f29'
  const [rows, setRows] = useState([])
  const [geo, setGeo] = useState(null)
  const [error, setError] = useState('')
  const [now, setNow] = useState(0)

  useEffect(() => {
    // ponytail: refetches everything every 60 s, only while the tab is visible (5 s blew the 500 MB/day free-plan
    // bandwidth on 2026-10-25); send only new rows, or push them, if report volume or viewer count grows
    const load = () => document.hidden || fetch('/api/reports').then(r => r.json())
      .then(d => { setRows(d); setNow(Date.now()); setError('') })
      .catch(() => setError('Could not load reports. Retrying...'))
    load()
    const id = setInterval(load, 60000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => { fetch('/api/geo/districts').then(r => r.json()).then(setGeo).catch(() => {}) }, [])

  const spikes = findSpikes(rows, now)
  const top = Object.entries(countBy(rows, r => r.generic_name || r.drug_name)).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const days = Array.from({ length: 30 }, (_, i) => ist(now - (29 - i) * DAY).slice(0, 10))
  const perDay = countBy(rows, r => ist(toTime(r.created_at)).slice(0, 10))
  const sev = countBy(rows, r => r.severity)
  // ponytail: exact uppercase district-name match; spelling variants (GURGAON vs GURUGRAM) count as 0
  const byDistrict = countBy(rows, r => r.district?.trim().toUpperCase())
  const axes = { ticks: { color: ink }, grid: { color: grid } }
  const opts = { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: axes, y: axes } }
  const latest = [...rows].sort((a, b) => toTime(b.created_at) - toTime(a.created_at)).slice(0, 10)

  return (
    <section>
      <h2 className="dash-title">Signal dashboard</h2>
      {error && <p className="alert">{error}</p>}
      {spikes.map(s => (
        <p key={s.drug} className="alert">
          Signal for review: {s.drug}: {s.recent} reports in the last 7 days vs about {s.weekly.toFixed(1)} per week before.
        </p>
      ))}
      <p className="muted">{rows.length} reports · updates every minute</p>

      <div className="grid">
        <div className="card">
          <h2>Top 10 medicines</h2>
          <div className="chart">
            <Bar options={{ ...opts, indexAxis: 'y' }}
              data={{ labels: top.map(t => t[0]), datasets: [{ data: top.map(t => t[1]), backgroundColor: light ? '#15803d' : '#22c55e', borderRadius: 4 }] }} />
          </div>
        </div>
        <div className="card">
          <h2>Reports per day (last 30 days, IST)</h2>
          <div className="chart">
            <Line options={opts}
              data={{ labels: days.map(d => d.slice(5)), datasets: [{ data: days.map(d => perDay[d] || 0), borderColor: light ? '#15803d' : '#22c55e', backgroundColor: light ? '#15803d' : '#22c55e', tension: 0.3 }] }} />
          </div>
        </div>
        <div className="card">
          <h2>Severity</h2>
          <div className="chart">
            <Doughnut options={{ maintainAspectRatio: false, plugins: { legend: { labels: { color: ink } } } }} data={{
              labels: SEVERITIES,
              datasets: [{ data: SEVERITIES.map(s => sev[s] || 0), backgroundColor: ['#f4c542', '#ff7a1a', '#ff3b30'], borderColor: light ? '#fff' : '#0d1916' }],
            }} />
          </div>
        </div>
        <div className="card">
          <h2>Reports by district</h2>
          <MapContainer className="map" center={[22, 80]} zoom={4} scrollWheelZoom={false}>
            <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {geo && (
              // key remounts the layer when data changes, so tooltips bound in onEachFeature show fresh counts
              <GeoJSON
                key={rows.length + theme}
                data={geo}
                style={f => ({ fillColor: shade(byDistrict[f.properties.district], light), fillOpacity: 0.8, color: light ? '#fff' : '#04070a', weight: 0.5 })}
                onEachFeature={(f, layer) => {
                  const d = f.properties.district // null on disputed slivers: drawn grey, no tooltip
                  if (d) layer.bindTooltip(`${d}: ${byDistrict[d] || 0}`)
                }}
              />
            )}
          </MapContainer>
        </div>
      </div>

      <div className="card">
        <h2>Latest reports</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>When (IST)</th><th>Medicine</th><th>Reaction</th><th>Severity</th><th>Age</th><th>Gender</th><th>District</th><th>State</th><th>Follow-up</th></tr>
            </thead>
            <tbody>
              {latest.map(r => (
                <tr key={r.id}>
                  <td>{ist(toTime(r.created_at)).slice(0, 16).replace('T', ' ')}</td>
                  <td>{r.generic_name || r.drug_name}</td>
                  <td>{r.reaction_english || r.reaction}</td>
                  <td style={r.severity === 'severe' ? { color: 'var(--danger)', fontWeight: 600 } : undefined}>{r.severity}</td>
                  <td>{r.age}</td><td>{r.gender}</td><td>{r.district}</td><td>{r.state}</td><td>{r.followup_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
