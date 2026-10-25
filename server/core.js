// Shared logic for the Express server (local dev) and the Hatchable API (hatchable/).
// Runtime-neutral: secrets come in as an `env` object (defaults to process.env under Node).
import drugs from '../data/reference/drugs.json' with { type: 'json' }

const clean = s => s.replace(/\s*\(.*?\)/g, '').trim()
let rand = Math.random
const pick = a => a[Math.floor(rand() * a.length)]
export const sqlTime = d => d.toISOString().slice(0, 19).replace('T', ' ')
// Optional details the PvPI form asks for; all text except weight_kg
export const DETAIL_FIELDS = ['manufacturer', 'expiry_date', 'dose', 'indication', 'started_on', 'stopped_on', 'action_taken',
  'rechallenge', 'other_medicines', 'medical_history', 'weight_kg']
export const FIELDS = ['created_at', 'raw_text', 'language', 'drug_name', 'generic_name', 'batch_no', 'reaction', 'reaction_english',
  'severity', 'onset', 'outcome', 'age', 'gender', 'district', 'state', 'confidence', ...DETAIL_FIELDS]
// PvPI form wording for "Action taken after reaction" and "Reaction reappeared after reintroduction"
export const ACTIONS = ['drug withdrawn', 'dose reduced', 'dose increased', 'dose not changed', 'not applicable', 'unknown']
export const RECHALLENGE = ['yes', 'no', 'not tried', 'unknown']
const oneOf = (v, list) => list.includes(String(v ?? '').toLowerCase()) ? String(v).toLowerCase() : null

// ---------- Seed ----------
// Names match the `district` / `state` properties of data/geo/india_districts.min.geojson.
const DISTRICTS = [['PUNE', 'MAHARASHTRA'], ['MUMBAI', 'MAHARASHTRA'], ['NAGPUR', 'MAHARASHTRA'],
  ['AHMADABAD', 'GUJARAT'], ['SURAT', 'GUJARAT'], ['VADODARA', 'GUJARAT'], ['JAIPUR', 'RAJASTHAN'],
  ['LUCKNOW', 'UTTAR PRADESH'], ['VARANASI', 'UTTAR PRADESH'], ['AGRA', 'UTTAR PRADESH'], ['PATNA', 'BIHAR'],
  ['CHENNAI', 'TAMIL NADU'], ['HYDERABAD', 'TELANGANA'], ['BHOPAL', 'MADHYA PRADESH'], ['INDORE', 'MADHYA PRADESH'],
  ['NEW DELHI', 'DELHI'], ['RANCHI', 'JHARKHAND'], ['LUDHIANA', 'PUNJAB'], ['RAIPUR', 'CHHATTISGARH'], ['KHORDHA', 'ODISHA']]

// 430 fake reports over the 60 days before `now`, ids 1..430. Deterministic for a given `now`.
export function seedRows(now) {
  let s = 42 // seeded PRNG so the planted spike is the only one that fires, every time
  rand = () => (s = (s * 16807) % 2147483647) / 2147483647 // Park-Miller
  const rows = []
  const fake = (drug, daysAgo, [district, state] = pick(DISTRICTS)) => {
    // A drug with no common ADRs listed (paracetamol) only has serious ones to report, so seed those as severe
    const severe = rand() < 0.08 || !drug.common_adrs.length
    rows.push({
      created_at: sqlTime(new Date(now - daysAgo * 864e5)), raw_text: null,
      language: pick(['hi', 'hi', 'hinglish', 'en', 'mr', 'ta']), drug_name: clean(pick(drug.common_indian_brands)),
      generic_name: clean(drug.generic_name).toLowerCase(), reaction: null,
      reaction_english: severe ? pick(drug.serious_adrs) : pick(drug.common_adrs),
      severity: severe ? 'severe' : pick(['mild', 'mild', 'moderate']), onset: pick([null, '2 days', '1 week', 'next morning']),
      outcome: pick(['recovering', 'recovered', 'not recovered', null]), age: 18 + Math.floor(rand() * 65),
      gender: pick(['male', 'female']), district, state, confidence: 1, batch_no: null,
      ...Object.fromEntries(DETAIL_FIELDS.map(f => [f, null])),
    })
  }
  for (let i = 0; i < 400; i++) fake(pick(drugs), rand() * 60)
  // Planted signal: amlodipine jumps in Pune/Mumbai over the last 4 days
  for (let i = 0; i < 30; i++) fake(drugs.find(d => d.generic_name === 'Amlodipine'), rand() * 4, pick(DISTRICTS.slice(0, 2)))
  rand = Math.random
  return rows.map((r, i) => ({ id: i + 1, ...r }))
}

// ---------- Privacy ----------
export const redact = s => s == null ? null : s.replace(/(my name is|mera naam|मेरा नाम)\s+((?:(?!hai\b|है|and\b|aur\b|i\b)[^\s,.।|]+\s*){1,2})/giu, '$1 [redacted] ')
  .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[redacted]')
  .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[redacted]') // Aadhaar-like
  .replace(/(?:\+91[\s-]?|\b0?)[6-9]\d{4}[\s-]?\d{5}\b/g, '[redacted]') // Indian mobile
  .trim()

// ponytail: in-memory per-IP limit (10/min) so a public URL can't burn the Gemini quota; per process/instance, resets on restart
const hits = new Map()
export function rateLimited(ip) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter(t => now - t < 60_000)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > 10
}

// ---------- Offline extraction ----------
// ponytail: keyword table + regexes, covers the demo sentences and common phrasings, not real NLP
const DEVANAGARI_BRANDS = { 'अमलोंग': 'Amlong', 'एमलोंग': 'Amlong', 'टेल्मा': 'Telma', 'ग्लाइकोमेट': 'Glycomet',
  'डोलो': 'Dolo 650', 'क्रोसिन': 'Crocin', 'ऑगमेंटिन': 'Augmentin', 'पैन 40': 'Pan 40', 'थायरोनॉर्म': 'Thyronorm' }
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const DRUG_TERMS = drugs.flatMap(d => [
  { re: new RegExp(`\\b${esc(clean(d.generic_name).split(' ')[0])}\\b`, 'i'), d, generic: true },
  ...d.common_indian_brands.map(b => {
    const brand = clean(b), first = brand.split(' ')[0]
    // short first words ("Pan", "Met") are real English words, so match the whole brand
    return { re: new RegExp(`\\b${esc(first.length > 3 ? first : brand)}\\b(\\s*\\d+)?`, 'i'), d, brand: first.length > 3 ? first : brand }
  }),
])

// [regex, english, severity]. Matched text is consumed so generic entries don't double-count specific ones.
const REACTIONS = [
  [/(होंठ|होठ|honth?|\blips?)\s*\S{0,6}\s*(सूज|sooj|suj|swell)|swollen lips?/i, 'lip swelling', 'severe'],
  [/(चेहरा|चेहरे|chehra|chehre|face|गला|गले|gala|gale|throat|tongue|जीभ|jeebh)\s*\S{0,6}\s*(सूज|sooj|suj|swell)|swollen (face|throat|tongue)/i, 'face/throat swelling', 'severe'],
  [/सांस|साँस|श्वास|saans|\bsans\b|breath|dam ghut/i, 'breathing difficulty', 'severe'],
  [/बेहोश|behosh|unconscious|faint|passed out/i, 'fainting / unconsciousness', 'severe'],
  [/chest pain|सीने में दर्द|छाती में दर्द|seene me(in)? dard|chhati me(in)? dard/i, 'chest pain', 'severe'],
  [/seizure|convulsion|\bfits?\b|दौरा|daura|mirgi|मिर्गी/i, 'seizure', 'severe'],
  [/(vomit|ulti|उल्टी)\S*\s*(\S+\s*){0,3}(blood|khoon|खून)|(blood|khoon|खून)\S*\s*(\S+\s*){0,3}(vomit|ulti|उल्टी)/i, 'vomiting blood', 'severe'],
  [/(पैर|पांव|pair|paon|feet|foot|legs?|ankles?|टखन)\S*\s*(\S+\s*){0,3}(सूजन|sujan|soojan|swell)|swollen (feet|ankles|legs)/i, 'swelling of feet (peripheral oedema)', 'mild'],
  [/सूजन|sujan|soojan|swell/i, 'swelling', 'mild'],
  [/loose motion|diarr|दस्त|\bdast\b|पतले दस्त/i, 'diarrhoea', 'moderate'],
  [/pet kharab|पेट खराब|पेट में दर्द|pet (me|mein) dard|stomach|tummy/i, 'stomach upset', 'mild'],
  [/rash|चकत्ते|chakatte|दाने|\bdaane\b|lal nishan|hives/i, 'rash', 'moderate'],
  [/itch|khujli|खुजली/i, 'itching', 'mild'],
  [/(sukhi|sookhi|dry|सूखी)\s*(khansi|khaansi|खांसी|खाँसी|cough)/i, 'dry cough', 'mild'],
  [/khansi|khaansi|खांसी|खाँसी|cough/i, 'cough', 'mild'],
  [/neend nahi|नींद नहीं|insomnia|can'?t sleep|no sleep/i, 'disturbed sleep', 'mild'],
  [/headache|sir ?dard|sar ?dard|सिर ?दर्द|सर ?दर्द/i, 'headache', 'mild'],
  [/dizz|chakkar|चक्कर/i, 'dizziness', 'mild'],
  [/nause|vomit|\bulti\b|उल्टी|ji machal|जी मिचल/i, 'nausea / vomiting', 'mild'],
]
const RED_FLAG = new RegExp(REACTIONS.filter(r => r[2] === 'severe').map(r => r[0].source).join('|'), 'i')

const NUM = { 'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5, 'दस': 10, ek: 1, do: 2, teen: 3, char: 4, paanch: 5, panch: 5, das: 10 }
const UNITS = [[/हफ्त|हफ़्त|सप्ताह|haft|week/i, 'weeks'], [/दिन|din|day/i, 'days'], [/मिनट|min/i, 'minutes'],
  [/घंट|ghant|hour|hr/i, 'hours'], [/महीन|mahin|month/i, 'months']]
const ONSET_RE = /(\d+(?:\s*-\s*\d+)?|एक|दो|तीन|चार|पांच|पाँच|दस|(?<![a-z])(?:ek|do|teen|char|paa?nch|das))\s*(हफ्त|हफ़्त|सप्ताह|hafte|hafta|weeks?|दिन|(?<![a-z])din\b|days?|मिनट|minutes?|mins?\b|घंट|ghante|hours?|hrs?\b|महीन|mahine|months?)/i
const ONSET_PHRASES = [[/next morning|agle din subah|अगली सुबह|अगले दिन सुबह/i, 'next morning'],
  [/next day|agle din|अगले दिन/i, 'next day'], [/immediately|turant|तुरंत|तुरन्त/i, 'immediately']]

function onset(t) {
  const m = t.match(ONSET_RE)
  if (m) return `${NUM[m[1].toLowerCase()] ?? m[1].replace(/\s/g, '')} ${UNITS.find(([re]) => re.test(m[2]))[1]}`
  return ONSET_PHRASES.find(([re]) => re.test(t))?.[1] ?? null
}

function offlineExtract(text = '') {
  let t = text
  for (const [dev, brand] of Object.entries(DEVANAGARI_BRANDS)) t = t.replaceAll(dev, ` ${brand} `)
  const hit = DRUG_TERMS.map(x => ({ ...x, m: t.match(x.re) })).find(x => x.m)
  const found = []
  let rest = t
  for (const [re, en, sev] of REACTIONS) if (re.test(rest)) { found.push([en, sev]); rest = rest.replace(re, ' ') }
  const sevs = found.map(f => f[1])
  const severity = sevs.includes('severe') || RED_FLAG.test(t) ? 'severe' : sevs.includes('moderate') ? 'moderate' : 'mild'
  const where = DISTRICTS.find(([d]) => t.toUpperCase().includes(d))
  let reaction_english = found.map(f => f[0]).join(', ') || null
  if (sevs.filter(s => s === 'severe').length > 1 && /swelling|breathing/.test(reaction_english)) reaction_english += ' (possible anaphylaxis)'
  return {
    drug_name: hit ? (hit.generic ? hit.m[0] : hit.brand + (hit.m[1] ?? '')).trim() : null,
    generic_name: hit ? (hit.generic ? hit.m[0].toLowerCase() : clean(hit.d.generic_name).toLowerCase()) : null,
    reaction: text || null, reaction_english, severity, onset: onset(t), outcome: null,
    age: +t.match(/(\d{1,3})\s*(?:saal|sal|years?|yrs?|साल|वर्ष)/i)?.[1] || null,
    gender: null, district: where?.[0] ?? null, state: where?.[1] ?? null,
    language: /[ऀ-ॿ]/.test(text) ? 'hi' : /\b(hai|ki|se|nahi|dawai|ho raha|kha)\b/i.test(text) ? 'hinglish' : 'en',
    confidence: hit && found.length ? 0.6 : hit || found.length ? 0.35 : 0.1,
    batch_no: t.match(/\b(?:batch|lot|b\.?\s?no)\b\.?\s*(?:no\.?)?\s*[:#-]?\s*([A-Z0-9][A-Z0-9/-]{2,19})\b/i)?.[1].toUpperCase() ?? null,
    expiry_date: t.match(/\bexp(?:iry)?\.?\s*(?:date)?\s*[:-]?\s*(\d{1,2}\s?[/.-]\s?\d{2,4})/i)?.[1].replace(/\s/g, '') ?? null,
    dose: [t.match(/\b\d+(?:\.\d+)?\s?(?:mg|mcg|µg|ml|iu)\b/i)?.[0],
      t.match(/\b(?:once|twice|thrice|[1-4]\s?times?)\s*(?:a|per)\s*day\b|din\s*(?:mein|me)\s*(?:ek|do|teen|1|2|3)\s*baar|\b(?:OD|BD|BID|TDS|TID|QID|HS|SOS)\b/)?.[0]]
      .filter(Boolean).join(', ') || null,
    weight_kg: +t.match(/(\d{2,3}(?:\.\d)?)\s*(?:kg|kilo)/i)?.[1] || null,
    action_taken: /band\s*kar|stopp?ed|stop\s*kar|chhod/i.test(t) ? 'drug withdrawn' : /kam\s*kar|reduced/i.test(t) ? 'dose reduced' : null,
  }
}

// ---------- Gemini ----------
const PROMPT = `You extract adverse drug reaction reports for India's Pharmacovigilance Programme (PvPI).
The input is a patient's or pharmacist's own words (Hindi, Hinglish, English or another Indian language) and/or up to three photos
(medicine strip or box, front and back, a prescription or a label).
Use EVERYTHING you are given: read every photo carefully, including small print on the back of a strip, and the whole text.
Medicine details usually come from the photos (brand, salt/generic, strength, "Mfd. by"/"Marketed by", "B.No.", "Exp."),
patient and reaction details usually from the text. If photo and text disagree on a medicine detail, trust the photo;
on a patient or reaction detail, trust the text. Read Hindi and other Indian scripts. Ignore price (MRP) and barcodes.
Return ONLY a JSON object with these keys (use null when not shown or stated, never guess):
drug_name (brand or name as written), generic_name (generic/salt in English, lowercase; several joined with " + "),
reaction (patient's words), reaction_english (short plain medical English),
severity ("mild" | "moderate" | "severe"; severe = life-threatening, breathing trouble, face/lip/throat swelling, fainting, seizure, hospitalisation),
onset (when it started relative to the drug, in English), outcome ("recovering" | "not recovered" | "recovered" | null),
age (number), gender ("male" | "female" | "other"), weight_kg (number), district, state, language (ISO code of the input text),
batch_no (batch or lot number as printed, e.g. after "B.No." or "Batch"), expiry_date (as printed, e.g. "08/2027"),
manufacturer (company after "Mfd. by" or "Manufactured by"; else "Marketed by"),
dose (strength and how it was taken, e.g. "650 mg, twice a day, by mouth"), indication (what it was taken for),
started_on (when the patient started the medicine, as stated), stopped_on (when they stopped, as stated),
action_taken (one of ${ACTIONS.map(a => `"${a}"`).join(' | ')}), rechallenge (did the reaction come back when restarted: ${RECHALLENGE.map(a => `"${a}"`).join(' | ')}),
other_medicines (other medicines taken at the same time), medical_history (relevant conditions, e.g. diabetes, pregnancy, allergies),
confidence (0-1, how sure you are about drug and reaction).`

async function geminiExtract(text, images, env) {
  const parts = [{ text: PROMPT + (text ? `\n\nInput text: ${text}` : '') }]
  for (const image of images) {
    const img = image.match(/^data:(image\/[\w+.-]+);base64,(.+)$/)
    if (img) parts.push({ inline_data: { mime_type: img[1], data: img[2] } })
  }
  // ponytail: two models tried in order, no retry/backoff. gemini-3.8-flash was overloaded (timeouts) on 2026-10-24; set GEMINI_MODEL to retry it
  for (const model of [env.GEMINI_MODEL || 'gemini-3.5-flash', 'gemini-flash-lite-latest']) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', signal: AbortSignal.timeout(images.length ? 30000 : 15000), // photos take longer to read
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: 'application/json' } }),
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const out = JSON.parse((await r.json()).candidates[0].content.parts[0].text)
      return { ...(Array.isArray(out) ? out[0] : out), source: model }
    } catch (e) { console.warn(`gemini ${model}:`, e.message) }
  }
  return null
}

// ---------- Request handlers (framework-free) ----------
// POST /api/extract body → { status, body }
export async function extract(reqBody, env = process.env) {
  // Up to 3 photos (front and back of the strip, a prescription); `image` is the older single-photo field
  const images = (Array.isArray(reqBody?.images) ? reqBody.images : reqBody?.image ? [reqBody.image] : [])
    .filter(i => typeof i === 'string' && /^data:image\//.test(i)).slice(0, 3)
  const text = redact(typeof reqBody?.text === 'string' ? reqBody.text : '') // never send PII to Gemini
  if (!text && !images.length) return { status: 400, body: { error: 'send text or image' } }
  const r = (env.GEMINI_API_KEY && await geminiExtract(text, images, env)) || { ...offlineExtract(text), source: 'offline' }
  const keys = ['drug_name', 'generic_name', 'reaction', 'reaction_english', 'severity', 'onset', 'outcome', 'age',
    'gender', 'district', 'state', 'language', 'confidence', 'batch_no', ...DETAIL_FIELDS]
  const out = Object.fromEntries(keys.map(k => [k, r[k] ?? null]))
  if (!['mild', 'moderate', 'severe'].includes(out.severity)) out.severity = 'mild'
  out.action_taken = oneOf(out.action_taken, ACTIONS)
  out.rechallenge = oneOf(out.rechallenge, RECHALLENGE)
  // The offline fallback cannot read photos; say so instead of silently ignoring them
  out.photos_read = r.source === 'offline' ? 0 : images.length
  out.photos_unread = r.source === 'offline' ? images.length : 0
  out.raw_text = text || null
  out.red_flag = out.severity === 'severe' || RED_FLAG.test(`${text} ${out.reaction_english ?? ''}`)
  out.source = r.source
  return { status: 200, body: out }
}

// POST /api/reports body → { error } or { row } (row without id, ready to store)
export function toRow(body = {}) {
  if (!['mild', 'moderate', 'severe'].includes(body.severity)) return { error: 'severity must be mild, moderate or severe' }
  const row = Object.fromEntries(FIELDS.map(f => {
    const v = body[f]
    return [f, v == null || v === '' ? null : typeof v === 'number' ? v : String(v)]
  }))
  row.created_at = sqlTime(new Date())
  row.raw_text = redact(row.raw_text)
  row.reaction = redact(row.reaction)
  row.district = row.district?.trim().toUpperCase() || null
  row.state = row.state?.trim().toUpperCase() || null
  // Optional; batch codes are letters, digits and / . - (e.g. "B.No. AB1234/23")
  row.batch_no = row.batch_no?.toUpperCase().replace(/^B\.?\s?NO\.?\s*|^BATCH\s*(NO\.?)?\s*/, '').replace(/[^A-Z0-9/.\- ]/g, '').trim().slice(0, 30) || null
  for (const f of DETAIL_FIELDS) if (typeof row[f] === 'string') row[f] = row[f].replace(/\s+/g, ' ').trim().slice(0, 200) || null
  const kg = Number(row.weight_kg)
  row.weight_kg = kg > 0 && kg < 400 ? Math.round(kg * 10) / 10 : null
  row.action_taken = oneOf(row.action_taken, ACTIONS)
  row.rechallenge = oneOf(row.rechallenge, RECHALLENGE)
  for (const f of ['indication', 'other_medicines', 'medical_history']) row[f] = redact(row[f])
  return { row }
}
