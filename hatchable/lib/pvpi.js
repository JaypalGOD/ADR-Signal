// The PvPI "Suspected ADR Reporting Form" (v1.4) as a standalone HTML page, printed to PDF by api/email/[id].js.
// Same rows as client/src/PvpiForm.jsx (the in-browser print copy); keep the two in step.
const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const row = (label, value) => `<tr><th>${esc(label)}</th><td>${esc(value)}</td></tr>`;
const table = rows => `<table><tbody>${rows.join('')}</tbody></table>`;

export function pvpiHtml(r) {
  const date = String(r.created_at ?? '').slice(0, 10).split('-').reverse().join('/');
  const drug = [r.drug_name, r.generic_name && r.generic_name !== r.drug_name && `(${r.generic_name})`].filter(Boolean).join(' ');
  return `<!doctype html><html><head><meta charset="utf-8"><title>PvPI ADR report #${esc(r.id)}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&display=swap" rel="stylesheet">
<style>
  body { font: 11pt/1.35 Arial, 'Noto Sans Devanagari', sans-serif; color: #000; margin: 24px; }
  header { border-bottom: 2px solid #000; margin-bottom: 8pt; }
  h1 { font-size: 15pt; margin: 0 0 4pt; }
  h2 { font-size: 12pt; margin: 10pt 0 4pt; background: #eee; padding: 3pt 5pt; }
  p { margin: 2pt 0; }
  table { width: 100%; border-collapse: collapse; page-break-inside: avoid; }
  th, td { border: 1px solid #000; padding: 4pt 6pt; text-align: left; vertical-align: top; }
  th { width: 42%; font-weight: normal; }
  td { height: 14pt; }
  .note { font-size: 9pt; margin-top: 10pt; }
</style></head><body>
<header>
  <h1>Suspected Adverse Drug Reaction Reporting Form</h1>
  <p>For VOLUNTARY reporting of ADRs · Pharmacovigilance Programme of India (PvPI), Indian Pharmacopoeia Commission</p>
  <p><b>Report #${esc(r.id)}</b> · Date: ${esc(date)} · Initial Case</p>
</header>
<h2>A. Patient information</h2>
${table([row('1. Patient Initials'), row('2. Age or date of birth', r.age), row('3. Gender (M / F / Other)', r.gender),
  row('4. Weight (in Kg.)', r.weight_kg), row('Location (district, state)', [r.district, r.state].filter(Boolean).join(', '))])}
<h2>B. Suspected adverse reaction</h2>
${table([row('5. Event / Reaction start date', r.onset), row('6. Event / Reaction stop date'),
  row('7. Describe Event / Reaction management with details, if any', r.reaction_english || r.reaction),
  row("Patient's own words", r.reaction || r.raw_text), row('12. Relevant investigations with dates'),
  row('13. Relevant medical / medication history', r.medical_history),
  row('14. Seriousness of the reaction', r.severity === 'severe' ? 'Yes (flagged as possibly serious)' : ''),
  row('Severity (reported)', r.severity), row('15. Outcome', r.outcome)])}
<h2>C. Suspected medication(s)</h2>
${table([row('8. Name (Brand / Generic)', drug), row('Manufacturer (if known)', r.manufacturer), row('Batch No. / Lot No.', r.batch_no),
  row('Expiry Date (if known)', r.expiry_date), row('Dose / Route / Frequency', r.dose),
  row('Therapy dates: Date Started / Date Stopped', r.started_on || r.stopped_on ? `${r.started_on || '-'} / ${r.stopped_on || 'continuing'}` : ''),
  row('Indication', r.indication), row('9. Action taken after reaction', r.action_taken),
  row('10. Reaction reappeared after reintroduction', r.rechallenge), row('11. Concomitant medical products', r.other_medicines)])}
<h2>D. Reporter details</h2>
${table([row('16. Name & Address'), row('Pin'), row('Email'), row('Contact No.'), row('Occupation'), row('Signature'), row('17. Date of this report', date)])}
<p class="note">Patient identity is held in strict confidence. Submitting a report does not constitute an admission
that anyone caused the reaction and has no legal implication on the reporter. PvPI Helpline (toll free): 1800-180-3024.</p>
</body></html>`;
}
