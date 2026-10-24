import { useEffect, useState } from 'react'
import PvpiForm from './PvpiForm.jsx'
import { Camera, Mic } from './icons.jsx'
import drugs from '../../data/reference/drugs.json'
import './report.css'

const clean = s => s.replace(/\s*\(.*?\)/g, '').trim()
const BRANDS = Object.fromEntries(drugs.flatMap(d => d.common_indian_brands.map(b => [clean(b), clean(d.generic_name).toLowerCase()])))
const GENERICS = drugs.map(d => clean(d.generic_name).toLowerCase())

const SEVERITY = [
  { value: 'mild', label: 'Mild', hint: 'Bothersome, daily life normal' },
  { value: 'moderate', label: 'Moderate', hint: 'Affects work or daily life' },
  { value: 'severe', label: 'Severe', hint: 'Hospital, fainting, breathing or face swelling' },
]
const OUTCOME = [
  { value: 'recovered', label: 'Recovered' }, { value: 'recovering', label: 'Recovering' },
  { value: 'not recovered', label: 'Not recovered' }, { value: 'unknown', label: 'Don’t know' },
]
const GENDER = [
  { value: 'female', label: 'Female' }, { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' }, { value: 'not stated', label: 'Prefer not to say' },
]
// Values match the PvPI form wording the server accepts (server/core.js ACTIONS and RECHALLENGE)
const ACTION_OPTIONS = [
  { value: 'drug withdrawn', label: 'Stopped it' }, { value: 'dose reduced', label: 'Took less' },
  { value: 'dose increased', label: 'Took more' }, { value: 'dose not changed', label: 'No change' },
  { value: 'not applicable', label: 'Not applicable' }, { value: 'unknown', label: 'Don’t know' },
]
const RECHALLENGE_OPTIONS = [
  { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'not tried', label: 'Not taken again' }, { value: 'unknown', label: 'Don’t know' },
]
const MEDICINE_MORE = ['dose', 'indication', 'manufacturer', 'expiry_date', 'started_on', 'stopped_on']
const PATIENT_MORE = ['weight_kg', 'other_medicines', 'medical_history']
const ONSET = ['Within hours', 'Same day', 'Next day', 'Within a week', '1–4 weeks', 'Over a month']
const STATES = ['Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh',
  'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal']

// Radio buttons drawn as pills: one tap, keyboard-friendly, and AI-filled values (any case) still match.
function Choice({ legend, name, options, value, onChange, disabled }) {
  const current = (value ?? '').toLowerCase()
  return (
    <fieldset className="choice" disabled={disabled}>
      <legend>{legend}</legend>
      <div className="choice-options">
        {options.map(o => (
          <label key={o.value} className={`choice-pill${o.hint ? ' choice-card' : ''} choice-${name}-${o.value.replaceAll(' ', '-')}`}>
            <input type="radio" name={name} value={o.value} checked={current === o.value} onChange={() => onChange(o.value)} />
            <span>{o.label}</span>
            {o.hint && <small>{o.hint}</small>}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const VOICE = [['hi-IN', 'हिंदी'], ['en-IN', 'English']]
const MAX_PHOTOS = 3
const PVPI_EMAIL = 'jaypaldabsara@gmail.com' // demo inbox; the real PvPI inbox is pvpi.ipc@gov.in

// Practo city pages (practo.com/<city>/<specialist>), each checked to load on 2026-10-25. Others 404, so they fall back to online consult.
const PRACTO_CITIES = new Set(['pune', 'mumbai', 'nagpur', 'ahmedabad', 'surat', 'vadodara', 'jaipur', 'lucknow', 'varanasi', 'agra',
  'patna', 'chennai', 'hyderabad', 'bhopal', 'indore', 'delhi', 'ranchi', 'ludhiana', 'raipur', 'bhubaneswar', 'bangalore', 'kolkata',
  'noida', 'gurgaon', 'chandigarh', 'coimbatore', 'thane', 'nashik', 'visakhapatnam', 'guwahati', 'dehradun', 'kanpur', 'madurai',
  'mysore', 'thiruvananthapuram', 'vijayawada', 'jodhpur', 'amritsar'])
const CITY_ALIAS = { AHMADABAD: 'ahmedabad', 'NEW DELHI': 'delhi', BENGALURU: 'bangalore', 'BENGALURU URBAN': 'bangalore',
  'BANGALORE URBAN': 'bangalore', KHORDHA: 'bhubaneswar', GURUGRAM: 'gurgaon', 'GAUTAM BUDDHA NAGAR': 'noida', MYSURU: 'mysore',
  'MUMBAI SUBURBAN': 'mumbai', 'KANPUR NAGAR': 'kanpur', KOLKATA: 'kolkata' }
// First match on the reaction wins; anything else goes to a general physician.
const SPECIALISTS = [
  [/rash|itch|skin|hives|blister|peel|eruption|hair loss/i, 'dermatologist', 'skin specialist'],
  [/stomach|tummy|diarr|vomit|nause|constipat|indigestion|acid|liver|jaundice|pancrea|\bwind\b/i, 'gastroenterologist', 'stomach specialist'],
  [/headache|dizz|seizure|numb|tingl|neuropath|tremor/i, 'neurologist', 'nerve specialist'],
  [/cough|wheez|sinus|breathless/i, 'pulmonologist', 'lung specialist'],
  [/palpitation|heartbeat|heart rate|ankle|feet|foot|\blegs?\b|oedema|edema|blood pressure/i, 'cardiologist', 'heart specialist'],
]

const titleCase = s => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())

// Links to the right kind of doctor near the reporter. Only the city and specialty go in a URL, never report details.
function doctorLinks(r) {
  const text = `${r.reaction_english ?? ''} ${r.reaction ?? ''}`
  const [, slug, label] = SPECIALISTS.find(([re]) => re.test(text)) ?? [null, 'general-physician', 'general physician']
  const district = (r.district ?? '').trim().toUpperCase()
  const city = CITY_ALIAS[district] ?? district.toLowerCase().replace(/\s+/g, '-')
  const where = district ? titleCase(district) : ''
  return {
    practo: PRACTO_CITIES.has(city)
      ? { href: `https://www.practo.com/${city}/${slug}`, text: `Find a ${label} in ${where} on Practo` }
      : { href: 'https://www.practo.com/consult', text: `Consult a ${label} online on Practo` },
    // Google Maps search works in every district; "near me" uses the phone's location when there is no district
    maps: { href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${label} near ${where || 'me'}`)}`,
      text: `Find a ${label} near ${where || 'you'} on Google Maps` },
  }
}

// Names a district may go by inside AMC addresses
const PLACE_ALIAS = { BENGALURU: ['bengaluru', 'bangalore'], BANGALORE: ['bengaluru', 'bangalore'], AHMADABAD: ['ahmedabad', 'ahmadabad'],
  KHORDHA: ['bhubaneswar', 'khordha'], GURUGRAM: ['gurugram', 'gurgaon'], MYSURU: ['mysuru', 'mysore'], 'NEW DELHI': ['delhi'],
  PRAYAGRAJ: ['prayagraj', 'allahabad'], 'MUMBAI SUBURBAN': ['mumbai'], 'KANPUR NAGAR': ['kanpur'] }
const sameState = (a, b) => a.toLowerCase().replace(/\band\b/g, '&').replace(/\s+/g, ' ').trim() === b.toLowerCase().replace(/\band\b/g, '&').replace(/\s+/g, ' ').trim()

// Up to two PvPI ADR Monitoring Centres (hospitals) for the reporter: same district first, else same state; government (free) first.
// amc rows are [state, name & address, 1 if government], from data/reference/amc/parse_amc.py.
function nearestAmc(amc, district, state) {
  const d = (district ?? '').trim().toUpperCase()
  const names = (PLACE_ALIAS[d] ?? (d ? [d.toLowerCase()] : [])).map(n => new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'))
  const inState = state ? amc.filter(([s]) => sameState(s, state)) : amc
  // Government first; within that, general medical colleges and hospitals before single-specialty institutes.
  // Judged on the centre's name (before the first comma), not its address ("Near Pune Railway Station").
  const rank = ([, full, g]) => {
    const n = full.split(',')[0]
    return g * 4 + (/medical college|general hospital|civil hospital|district hospital|AIIMS|institute of medical sciences/i.test(n) ? 2 : 0)
      - (/cancer|onco|mental|psychiat|neuro|child|paediatric|pediatric|eye|ophthal|dental|chest|tuberculosis|\bTB\b|ortho|maternity|women|heart|cardiac|kidney|nephro/i.test(n) ? 3 : 0)
      - (/armed forces|military|command hospital|railway|ESIC/i.test(n) ? 3 : 0)   // mainly serve their own staff or insured workers
  }
  const gov = rows => [...rows].sort((a, b) => rank(b) - rank(a)).slice(0, 2)
  const local = names.length ? inState.filter(([, n]) => names.some(re => re.test(n))) : []
  if (local.length) return { scope: titleCase(d), centres: gov(local) }
  return state && inState.length ? { scope: inState[0][0], centres: gov(inState) } : null
}

// Fallback when the server email fails: a ready-made Gmail draft to the PvPI (demo) inbox, sent from the reporter's own account
function premadeEmail(r) {
  const line = (label, v) => `${label}: ${v ?? '-'}`
  const body = [
    `Suspected adverse drug reaction report #${r.id}, submitted via ADR Signal.`, '',
    line('Medicine', r.drug_name), line('Generic name', r.generic_name),
    // Optional details: only the ones given
    ...[['Batch / lot no.', r.batch_no], ['Manufacturer', r.manufacturer], ['Expiry', r.expiry_date], ['Dose', r.dose],
      ['Taken for', r.indication], ['Medicine started', r.started_on], ['Medicine stopped', r.stopped_on], ['Action taken', r.action_taken],
      ['Reaction came back on restarting', r.rechallenge], ['Other medicines', r.other_medicines],
      ['Health conditions', r.medical_history], ['Weight', r.weight_kg && `${r.weight_kg} kg`]]
      .filter(([, v]) => v != null && v !== '').map(([k, v]) => line(k, v)),
    line('Reaction', r.reaction_english), line('Patient’s words', r.reaction || r.raw_text),
    line('Severity', r.severity), line('Reaction started', r.onset), line('Outcome', r.outcome),
    line('Age', r.age), line('Gender', r.gender), line('Location', [r.district, r.state].filter(Boolean).join(', ') || null),
    line('Date', r.created_at?.slice(0, 10)),
  ].join('\n')
  const subject = `${r.severity === 'severe' ? 'SEVERE: ' : ''}Suspected ADR report #${r.id}: ${r.generic_name || r.drug_name || 'medicine'}`
  return { gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${PVPI_EMAIL}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` }
}

async function post(url, body) {
  const r = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`)
  return data
}

export default function Report() {
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const [voiceLang, setVoiceLang] = useState('hi-IN')
  const [images, setImages] = useState([])
  const [report, setReport] = useState(null)
  const [saved, setSaved] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [phone, setPhone] = useState('')
  const [followup, setFollowup] = useState(null)
  const [mail, setMail] = useState(null)
  const [amc, setAmc] = useState(null)

  // PvPI's ADR Monitoring Centre list (132 KB) is only needed once a report is saved
  useEffect(() => {
    if (saved && !amc) fetch('/amc.json').then(r => r.json()).then(setAmc).catch(() => setAmc([]))
  }, [saved, amc])

  function listen() {
    const rec = new SpeechRecognition()
    rec.lang = voiceLang
    rec.onresult = e => setText(t => (t ? t + ' ' : '') + e.results[0][0].transcript)
    rec.onerror = e => setError('Microphone problem (' + e.error + '). You can type instead.')
    rec.onend = () => setListening(false)
    setError('')
    setListening(true)
    rec.start()
  }

  function onPhoto(e) {
    // Up to 3 photos, shrunk to <=1800px JPEG: sharp enough for batch and expiry print, and 3 of them stay well
    // under the 6 MB request limit as base64
    for (const file of [...e.target.files].slice(0, MAX_PHOTOS - images.length)) {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, 1800 / Math.max(img.width, img.height))
        const canvas = Object.assign(document.createElement('canvas'), { width: img.width * scale, height: img.height * scale })
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        setImages(list => list.length < MAX_PHOTOS ? [...list, canvas.toDataURL('image/jpeg', 0.85)] : list)
        URL.revokeObjectURL(img.src)
      }
      img.src = URL.createObjectURL(file)
    }
    e.target.value = '' // so the same photo can be picked again after removing it
  }

  async function extract() {
    setBusy(true); setError(''); setSaved(null); setFollowup(null); setMail(null)
    try {
      setReport(await post('/api/extract', { text: text || undefined, images: images.length ? images : undefined }))
    } catch {
      setError('We could not read this automatically. Please fill in the details below yourself.')
      setReport({ raw_text: text, severity: 'mild', source: 'manual' })
    }
    setBusy(false)
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const row = await post('/api/reports', { ...report, age: report.age ? Number(report.age) : null })
      setSaved({ created_at: new Date().toISOString(), ...row })
    } catch (err) {
      setError('Could not save the report: ' + err.message)
    }
    setBusy(false)
  }

  async function sendEmail() {
    setMail('sending')
    try {
      await post(`/api/email/${saved.id}`, {})
      setMail('sent')
    } catch {
      setMail('failed')
    }
  }

  async function sendFollowup() {
    try {
      setFollowup(await post(`/api/followup/${saved.id}`, { phone }))
    } catch (err) {
      setFollowup({ status: 'failed', message: err.message })
    }
  }

  const set = (k, v) => setReport(r => ({ ...r, [k]: v }))
  // Picking a known brand fills in its generic name when that is still empty
  const setDrug = v => setReport(r => ({ ...r, drug_name: v, generic_name: r.generic_name || BRANDS[v] || r.generic_name }))
  const field = k => ({ value: report?.[k] ?? '', onChange: e => set(k, e.target.value), disabled: !!saved })
  const doctor = saved && doctorLinks({ ...report, ...saved })
  const email = saved && premadeEmail({ ...report, ...saved })
  const centres = saved && amc && nearestAmc(amc, saved.district ?? report.district, saved.state ?? report.state)
  const stateOption = STATES.find(s => s.toLowerCase() === (report?.state ?? '').trim().toLowerCase())

  return (
    <section className="report">
      <h2>Report a medicine side effect</h2>
      <p className="report-muted">Tell us in your own words.</p>

      <textarea rows={4} value={text} onChange={e => setText(e.target.value)}
        placeholder="e.g. My feet have been swelling for two weeks since I started the BP tablet Amlong" />

      <div className="report-actions">
        {SpeechRecognition && <div className="report-voice">
          <button type="button" onClick={listen} disabled={listening}>
            <Mic /> {listening ? 'Listening…' : 'Speak'}
          </button>
          <div className="report-voice-lang" role="group" aria-label="Speaking language">
            {VOICE.map(([code, label]) => <button key={code} type="button" lang={code.slice(0, 2)}
              className={voiceLang === code ? 'chip chip-on' : 'chip'} aria-pressed={voiceLang === code}
              onClick={() => setVoiceLang(code)} disabled={listening}>{label}</button>)}
          </div>
        </div>}

        <label className={images.length >= MAX_PHOTOS ? 'report-btn report-btn-off' : 'report-btn'}>
          <Camera /> {images.length ? `Add another photo (${images.length}/${MAX_PHOTOS})` : 'Medicine photos'}
          <input type="file" accept="image/*" multiple onChange={onPhoto} disabled={images.length >= MAX_PHOTOS} hidden />
        </label>
        <p className="report-muted report-photo-hint">Photograph the front and the back of the strip: the back usually has the batch number and expiry date.</p>
        {images.length > 0 && <div className="report-thumbs">
          {images.map((src, i) => <div className="report-thumb" key={i}>
            <img src={src} alt={`Medicine photo ${i + 1}`} />
            <button type="button" onClick={() => setImages(list => list.filter((_, j) => j !== i))} aria-label={`Remove photo ${i + 1}`}>Remove</button>
          </div>)}
        </div>}

        <button type="button" className="report-primary" onClick={extract} disabled={busy || (!text.trim() && !images.length)}>
          {busy && !report ? 'Reading your report…' : 'Create report'}
        </button>
      </div>

      {error && <p className="report-error" role="alert">{error}</p>}

      {report && <form className="report-card" onSubmit={submit}>
        {report.red_flag && <div className="report-redflag" role="alert">
          This may be serious. Seek medical help now or call <a href="tel:108">108</a>.
        </div>}
        <h3>Check and correct your report</h3>
        <p className="report-muted">
          Read by: {report.source || 'manual'} · confidence {Math.round((report.confidence ?? 0) * 100)}%
          {report.photos_read > 0 && ` · ${report.photos_read} photo${report.photos_read > 1 ? 's' : ''} read`}
        </p>
        {report.photos_unread > 0 && <p className="report-notice" role="status">
          We could not read your {report.photos_unread > 1 ? 'photos' : 'photo'} automatically just now. Please type the medicine name,
          batch number and expiry date from the strip below.
        </p>}

        <h4 className="report-section">Medicine</h4>
        <div className="report-grid">
          <label>Medicine (as written on the strip)
            <input {...field('drug_name')} onChange={e => setDrug(e.target.value)} list="brand-list" placeholder="e.g. Amlong" />
          </label>
          <label>Generic name
            <input {...field('generic_name')} list="generic-list" placeholder="e.g. amlodipine" />
          </label>
          <label><span>Batch / lot number <span className="report-optional">(optional)</span></span>
            <input {...field('batch_no')} placeholder="e.g. AB1234" autoCapitalize="characters" spellCheck="false" maxLength={40} />
            <span className="report-muted">Printed on the strip or box after “B.No.” or “Batch”. It helps PvPI trace a faulty batch.</span>
          </label>
          <datalist id="brand-list">{Object.keys(BRANDS).map(b => <option key={b} value={b} />)}</datalist>
          <datalist id="generic-list">{GENERICS.map(g => <option key={g} value={g} />)}</datalist>
        </div>
        <details className="report-more" open={MEDICINE_MORE.some(k => report[k])}>
          <summary>More medicine details <span className="report-optional">(optional, for the PvPI form)</span></summary>
          <div className="report-grid">
            <label>Strength and dose<input {...field('dose')} placeholder="e.g. 650 mg, twice a day, by mouth" /></label>
            <label>What it was taken for<input {...field('indication')} placeholder="e.g. fever, blood pressure" /></label>
            <label>Manufacturer<input {...field('manufacturer')} placeholder="After “Mfd. by” on the pack" /></label>
            <label>Expiry date<input {...field('expiry_date')} placeholder="e.g. 08/2027" /></label>
            <label>Started taking it<input {...field('started_on')} placeholder="e.g. 3 weeks ago, 1 Oct 2026" /></label>
            <label>Stopped taking it<input {...field('stopped_on')} placeholder="Leave empty if still taking it" /></label>
          </div>
        </details>

        <h4 className="report-section">Reaction</h4>
        <label>What happened (your words)
          <textarea rows={2} {...field('reaction')} />
        </label>
        <label>Reaction in plain English
          <input {...field('reaction_english')} placeholder="e.g. swelling of feet" />
        </label>
        <Choice legend="How serious was it?" name="severity" options={SEVERITY} value={report.severity || 'mild'}
          onChange={v => set('severity', v)} disabled={!!saved} />
        <fieldset className="choice" disabled={!!saved}>
          <legend>When did it start after taking the medicine?</legend>
          <div className="choice-options">
            {ONSET.map(o => <button key={o} type="button" className={report.onset === o ? 'chip chip-on' : 'chip'}
              aria-pressed={report.onset === o} onClick={() => set('onset', o)}>{o}</button>)}
          </div>
          <input {...field('onset')} aria-label="When it started, in your words" placeholder="Or type it, e.g. 2 weeks" />
        </fieldset>
        <Choice legend="How is the person now?" name="outcome" options={OUTCOME} value={report.outcome}
          onChange={v => set('outcome', v)} disabled={!!saved} />
        <Choice legend="What was done about the medicine?" name="action_taken" options={ACTION_OPTIONS} value={report.action_taken}
          onChange={v => set('action_taken', v)} disabled={!!saved} />
        <Choice legend="Did the reaction come back when the medicine was taken again?" name="rechallenge" options={RECHALLENGE_OPTIONS}
          value={report.rechallenge} onChange={v => set('rechallenge', v)} disabled={!!saved} />

        <h4 className="report-section">Patient</h4>
        <div className="report-grid">
          <label>Age
            <input {...field('age')} type="number" min="0" max="120" inputMode="numeric" placeholder="Years" />
          </label>
          <Choice legend="Gender" name="gender" options={GENDER} value={report.gender}
            onChange={v => set('gender', v)} disabled={!!saved} />
        </div>
        <details className="report-more" open={PATIENT_MORE.some(k => report[k])}>
          <summary>More about the patient <span className="report-optional">(optional)</span></summary>
          <div className="report-grid">
            <label>Weight (kg)<input {...field('weight_kg')} type="number" min="1" max="300" step="0.1" inputMode="decimal" placeholder="e.g. 62" /></label>
            <label>Other medicines at the same time<input {...field('other_medicines')} placeholder="e.g. metformin, vitamin D" /></label>
            <label>Health conditions<input {...field('medical_history')} placeholder="e.g. diabetes, pregnancy, allergies" /></label>
          </div>
        </details>

        <h4 className="report-section">Location</h4>
        <div className="report-grid">
          <label>State or union territory
            <select value={stateOption ?? report.state ?? ''} onChange={e => set('state', e.target.value || null)} disabled={!!saved}>
              <option value="">Select state</option>
              {!stateOption && report.state && <option value={report.state}>{report.state}</option>}
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>District
            <input {...field('district')} placeholder="e.g. Pune" />
          </label>
        </div>

        {!saved && <button className="report-primary" disabled={busy}>{busy ? 'Saving…' : 'Submit report'}</button>}
      </form>}

      {saved && <div className="report-card report-saved">
        <p><b>Report #{saved.id} saved.</b> Thank you, this helps make medicines safer for everyone.</p>

        <div className="report-doctor">
          <h4>See a doctor about this side effect</h4>
          {saved.severity === 'severe' || report.red_flag
            ? <p className="report-redflag" role="alert">This may be serious. Call <a href="tel:108">108</a> now or go to the nearest hospital. Don’t wait for an appointment.</p>
            : <>
              <p className="report-muted">First tell the doctor who prescribed {saved.drug_name || 'this medicine'}. Don’t stop a prescribed medicine without advice.</p>
              {centres && <div className="report-amc">
                <b>ADR Monitoring Centres {centres.scope === titleCase((saved.district ?? '').trim()) ? 'near you' : `in ${centres.scope}`}</b>
                <span className="report-muted">Part of PvPI: their doctors assess medicine side effects.</span>
                <ul>
                  {centres.centres.map(([, name, gov]) => <li key={name}>
                    <span>{name}{gov ? <em> · Government, low or no cost</em> : null}</span>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`} target="_blank" rel="noopener noreferrer">Get directions</a>
                  </li>)}
                </ul>
                <span className="report-muted">PvPI helpline (free): <a href="tel:18001803024">1800-180-3024</a></span>
              </div>}
              <a className="report-btn" href="https://esanjeevani.mohfw.gov.in/" target="_blank" rel="noopener noreferrer">Free online doctor: eSanjeevani (Govt. of India)</a>
              <a className="report-btn" href={doctor.maps.href} target="_blank" rel="noopener noreferrer">{doctor.maps.text}</a>
              <a className="report-btn" href={doctor.practo.href} target="_blank" rel="noopener noreferrer">{doctor.practo.text}</a>
              <p className="report-muted">Practo is a private, paid service. We share none of your report with Google, Practo or eSanjeevani.</p>
            </>}
        </div>

        <label>WhatsApp number for a follow-up
          <input type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98…"
            value={phone} onChange={e => setPhone(e.target.value)} />
        </label>
        <p className="report-muted">We use this number once to send the message. It is not stored.</p>
        <button type="button" onClick={sendFollowup} disabled={!phone.trim()}>Send follow-up</button>
        {followup && <p className="report-muted">Follow-up {followup.status}: {followup.message}</p>}

        <button type="button" onClick={() => window.print()}>Download PvPI form (PDF)</button>
        <button type="button" className="report-primary" onClick={sendEmail} disabled={mail === 'sending' || mail === 'sent'}>
          {mail === 'sending' ? 'Sending… (making the PDF)' : mail === 'sent' ? '✓ Sent to PvPI' : 'Email this report to PvPI (PDF attached)'}
        </button>
        {mail === 'sent' && <p className="report-muted">Emailed to {PVPI_EMAIL} with the filled PvPI form attached as a PDF.</p>}
        {mail === 'failed' && <>
          <p className="report-notice">The email could not be sent just now. Try again, or send it yourself: download the form above, then open a ready-made email and attach the PDF.</p>
          <a className="report-btn" href={email.gmail} target="_blank" rel="noopener noreferrer">Open a ready-made email in Gmail</a>
        </>}
        <PvpiForm report={{ ...report, ...saved }} />
      </div>}
    </section>
  )
}
