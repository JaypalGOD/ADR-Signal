import assert from 'node:assert/strict'
import { findSpikes } from './spikes.js'

const now = Date.parse('2026-10-23T12:00:00Z')
const at = daysAgo => new Date(now - daysAgo * 86400000).toISOString().slice(0, 19).replace('T', ' ')
const rows = [
  // spiking: 10 in the last week vs 4 over the 4 weeks before (1/week)
  ...Array.from({ length: 10 }, (_, i) => ({ generic_name: 'amlodipine', created_at: at(i % 6) })),
  ...Array.from({ length: 4 }, (_, i) => ({ generic_name: 'amlodipine', created_at: at(10 + i * 6) })),
  // flat: 8 per week, every week
  ...Array.from({ length: 40 }, (_, i) => ({ generic_name: 'metformin', created_at: at(i * 0.875) })),
]
const spikes = findSpikes(rows, now)
assert.deepEqual(spikes.map(s => s.drug), ['amlodipine'])
assert.equal(spikes[0].recent, 10)
assert.equal(spikes[0].weekly, 1)
console.log('spikes ok')
