import { createPortal } from 'react-dom'

// Print-only copy of the PvPI "Suspected ADR Reporting Form" (v1.4). Rendered straight into
// <body> so report.css can hide every other body child when printing, whatever the shell looks like.
const Row = ({ label, value }) => (
  <tr><th>{label}</th><td>{value ?? ''}</td></tr>
)

export default function PvpiForm({ report: r }) {
  const date = r.created_at.slice(0, 10).split('-').reverse().join('/') // ISO or SQLite 'YYYY-MM-DD hh:mm:ss'
  const drug = [r.drug_name, r.generic_name && r.generic_name !== r.drug_name && `(${r.generic_name})`]
    .filter(Boolean).join(' ')

  return createPortal(
    <div className="pvpi-form">
      <header>
        <h1>Suspected Adverse Drug Reaction Reporting Form</h1>
        <p>For VOLUNTARY reporting of ADRs · Pharmacovigilance Programme of India (PvPI), Indian Pharmacopoeia Commission</p>
        <p><b>Report #{r.id}</b> · Date: {date} · Initial Case</p>
      </header>

      <h2>A. Patient information</h2>
      <table><tbody>
        <Row label="1. Patient Initials" />
        <Row label="2. Age or date of birth" value={r.age} />
        <Row label="3. Gender (M / F / Other)" value={r.gender} />
        <Row label="4. Weight (in Kg.)" value={r.weight_kg} />
        <Row label="Location (district, state)" value={[r.district, r.state].filter(Boolean).join(', ')} />
      </tbody></table>

      <h2>B. Suspected adverse reaction</h2>
      <table><tbody>
        <Row label="5. Event / Reaction start date" value={r.onset} />
        <Row label="6. Event / Reaction stop date" />
        <Row label="7. Describe Event / Reaction management with details, if any" value={r.reaction_english || r.reaction} />
        <Row label="Patient's own words" value={r.reaction || r.raw_text} />
        <Row label="12. Relevant investigations with dates" />
        <Row label="13. Relevant medical / medication history" value={r.medical_history} />
        <Row label="14. Seriousness of the reaction" value={r.red_flag ? 'Yes (flagged as possibly serious)' : ''} />
        <Row label="Severity (reported)" value={r.severity} />
        <Row label="15. Outcome" value={r.outcome} />
      </tbody></table>

      <h2>C. Suspected medication(s)</h2>
      <table><tbody>
        <Row label="8. Name (Brand / Generic)" value={drug} />
        <Row label="Manufacturer (if known)" value={r.manufacturer} />
        <Row label="Batch No. / Lot No." value={r.batch_no} />
        <Row label="Expiry Date (if known)" value={r.expiry_date} />
        <Row label="Dose / Route / Frequency" value={r.dose} />
        <Row label="Therapy dates: Date Started / Date Stopped" value={[r.started_on, r.stopped_on].some(Boolean) ? `${r.started_on || '-'} / ${r.stopped_on || 'continuing'}` : null} />
        <Row label="Indication" value={r.indication} />
        <Row label="9. Action taken after reaction" value={r.action_taken} />
        <Row label="10. Reaction reappeared after reintroduction" value={r.rechallenge} />
        <Row label="11. Concomitant medical products" value={r.other_medicines} />
      </tbody></table>

      <h2>D. Reporter details</h2>
      <table><tbody>
        <Row label="16. Name & Address" />
        <Row label="Pin" />
        <Row label="Email" />
        <Row label="Contact No." />
        <Row label="Occupation" />
        <Row label="Signature" />
        <Row label="17. Date of this report" value={date} />
      </tbody></table>

      <p className="pvpi-note">
        Patient identity is held in strict confidence. Submitting a report does not constitute an admission
        that anyone caused the reaction and has no legal implication on the reporter.
        PvPI Helpline (toll free): 1800-180-3024.
      </p>
    </div>,
    document.body,
  )
}
