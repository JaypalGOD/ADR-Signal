import { db, email, browser } from 'hatchable';

export const access = 'public';
export const methods = ['POST'];

// ponytail: demo inbox hardcoded; the free plan only delivers to the project owner. Real PvPI inbox: pvpi.ipc@gov.in
const TO = 'jaypaldabsara@gmail.com';

// "Send to PvPI" button: emails one saved report with its filled PvPI form attached as a PDF.
// Once per report, so the public button can't be used to flood the inbox.
export default async function (req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  const { rows } = await db.query(
    'SELECT id, drug_name, generic_name, reaction_english, severity, batch_no, emailed_at FROM reports WHERE id = $1', [id]);
  const r = rows[0];
  if (!r) return res.status(404).json({ error: 'report not found' });
  if (r.emailed_at) return res.json({ status: 'sent', to: TO, already: true });

  try {
    const pdf = await browser.pdf(`https://${req.headers.host}/api/pvpi/${id}`, { format: 'A4', printBackground: true });
    let bin = '';
    for (let i = 0; i < pdf.length; i += 0x8000) bin += String.fromCharCode(...pdf.subarray(i, i + 0x8000));
    const medicine = r.generic_name || r.drug_name || 'medicine';
    const text = `Suspected adverse drug reaction report #${id}, submitted via ADR Signal.\n\n` +
      `Medicine: ${r.drug_name ?? '-'}\nReaction: ${r.reaction_english ?? '-'}\nSeverity: ${r.severity}\nBatch / lot no.: ${r.batch_no ?? '-'}\n\n` +
      'The filled PvPI Suspected ADR Reporting Form is attached as a PDF.';
    await email.send({
      to: TO,
      subject: `${r.severity === 'severe' ? 'SEVERE: ' : ''}Suspected ADR report #${id}: ${medicine}`,
      text, html: `<pre style="font: 14px/1.5 Arial, sans-serif; white-space: pre-wrap">${text.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}</pre>`,
      attachments: [{ filename: `PvPI-ADR-report-${id}.pdf`, contentType: 'application/pdf', content: btoa(bin) }],
    });
  } catch (e) {
    console.warn('report email:', e.message);
    return res.status(502).json({ error: 'Email could not be sent just now' });
  }
  await db.query('UPDATE reports SET emailed_at = NOW() WHERE id = $1', [id]);
  return res.json({ status: 'sent', to: TO });
}
