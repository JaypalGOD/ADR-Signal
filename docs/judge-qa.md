# Judge Q&A: ADR Signal (SapioCoders)

Short, honest answers to the questions judges are most likely to ask. Figures come from `docs/pitch-facts.md`, which has the sources.

## The one-liner

ADR Signal lets anyone in India report a medicine side effect in their own words in about a minute, and turns those reports into early warnings. We don't replace PvPI; we're the easy front door that feeds it.

## Problem and impact

**Why does this matter?**
About 94% of adverse drug reactions are never reported (median across 37 studies, Hazell & Shakir 2006). India has 1,075 ADR Monitoring Centres but gets only about 17,000 reports a month for 1.4 billion people (IPC, Oct 2025). If nobody reports, a bad batch or a dangerous combination is caught late.

**Does a reporting app actually increase reports?**
Yes. In a cluster-randomised trial in Uganda, the Med Safety app raised ADR reporting by 73% (Lancet Global Health 2025). UNDP backed the same app in Ghana in 2019, and it is now used in 18 countries. The rise was mainly in non-serious reports.

**Which SDG?**
SDG 3.8: universal health coverage, including access to safe medicines. Supporting: SDG 3.d, early warning for health risks.

## How it works

**Does a report reach PvPI today?**
Partly. Every report saves to our database and prints as the official PvPI Suspected ADR Reporting Form. After saving, "Email this report to PvPI" opens the reporter's email app addressed to pvpi.ipc@gov.in with the details filled in; they attach the PDF and send. A direct electronic feed into PvPI needs government approval, so that is the long-term step, not a hackathon claim.

**How does it reach medicine makers?**
Through the regulator, the normal route: PvPI signals go to CDSCO, which can order alerts, label changes or recalls. PvPI has already issued 182 drug safety alerts, 66 package-leaflet updates and 16 confirmed signals to CDSCO (PvPI profile, Sept 2025).

**What does the AI do, and what if it's wrong?**
It turns free text, voice or a medicine photo into PvPI form fields. The reporter checks and corrects every field before submitting, and an AMC doctor still assesses each report. If the AI service is down, an offline keyword matcher fills the form, so a report is never lost.

**Is the dashboard data real?**
No. It is simulated demo data with a planted amlodipine spike. The detection rule is real and works the same on live data: flag a medicine when its last 7 days have at least double its earlier weekly average and at least 8 reports.

## Risks

**Privacy?**
Names, phone numbers and Aadhaar-like numbers are removed before any text reaches the AI. The WhatsApp follow-up uses the phone number once and never stores it. Health data falls under India's DPDP Act 2023; reports are meant to stay within PvPI.

**Fake or duplicate reports?**
There is rate limiting today. For the pilot: phone OTP or a pharmacy QR check, and AMC review catches the rest.

**Will people actually use it?**
PvPI already proposes QR codes in every pharmacy; ours can be that QR. Plus clinics and WhatsApp sharing. It works in Hindi, Hinglish and English, by text, voice or photo, with no app to install.

**Is it feasible?**
The technology is live today and cheap to run. The hard part, turning reports into action, already exists in PvPI. The real work is partnership: email reports now, a one-district pilot with a medical college next, an electronic link after approval.

## If something goes wrong in the demo

- No internet: play `presentation/ADR-Signal-demo-backup.mp4`.
- AI is slow: the offline matcher still fills the form; say so.
- Live URL: https://adr-signal.hatchable.site
