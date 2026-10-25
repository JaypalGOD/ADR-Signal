# Pitch facts: ADR reporting app for India (supports PvPI)

Researched 2026-10-22. Each bullet gives the fact, its source and the year. **Unverified** means I could not confirm the fact at a primary source. Do not put those on a slide without checking them first.

## 1. India: PvPI scale and under-reporting

- **PvPI has 1,075 ADR Monitoring Centres (AMCs)** (medical colleges, district and corporate hospitals). It started with 22.
  IPC, *PvPI Information Profile*, Sept 2025: https://www.ipc.gov.in/images/PvPI_Profile_-_19.9.2025.pdf (2025)
- **Older figure, avoid on slides:** the PvPI FAQ still says "250 ADR Monitoring Centres". https://www.ipc.gov.in/PvPI/faq.html (undated, outdated)
- **About 17,000 reports a month nationally.** October 2025: 17,015 ICSRs including follow-ups. Of these, 9,628 came from AMC/ART/NTEP centres and 7,387 from pharma companies (MAHs).
  IPC, *ADR Reporting Status, Oct 2025*: https://ipc.gov.in/images/pvpi/ADR-reporting-status-of-PvPI---Oct-2025.pdf (2025). August 2025 was 16,531: https://ipc.gov.in/images/pvpi/ADR-reporting-status-of-PvPI---Aug-2025.pdf
  - Derived (my arithmetic, not an IPC figure): 17,015 × 12 ≈ **2 lakh reports a year** for 1.4 billion+ people, and that count includes follow-ups.
  - In the same October 2025 report, **many AMCs list 0 ICSRs for the month**. That supports the point that the network exists but reporting is thin. Count them from the PDF before quoting a number.
- **India is the 8th-largest contributor to WHO's global database VigiBase, with about 1.9–2.3% of global ICSRs.** The USA has 40.9%. India has about 18% of the world's population. The population share is general knowledge, not from this source.
  IPC PvPI Profile 2025, figure "Global Status of Indian ICSRs": https://www.ipc.gov.in/images/PvPI_Profile_-_19.9.2025.pdf (2025). The chart label alignment is ambiguous: India sits next to 2.3% / 1.9%. "8th largest" is stated explicitly.
- **74.5% of Indian health professionals had never reported an ADR**, and 28.7% were "not interested in reporting". This is a meta-analysis of 28 Indian KAP studies.
  Bhagavathula et al., *PLoS ONE* 2016: https://pmc.ncbi.nlm.nih.gov/articles/PMC4807086/ (2016)
- The same review states that India's contribution to global ADR reporting was "below 1%". **Unverified:** it is a secondary citation, and it conflicts with IPC's current 8th-largest ranking. Use the IPC figure instead.
- Consumers can report through the **ADR PvPI app, toll-free helpline 1800-180-3024 (IVRS in 10 languages), and the consumer form in 10 Indian languages**. Patients have channels, but they are paper, phone or a separate app with low awareness.
  https://www.ipc.gov.in/PvPI/faq.html ; https://ipc.gov.in/news-highlights/1399-ipc-expands-helpline-number-1800-180-3024-multilingual-ivr-system.html ; PvPI Profile 2025 (2025)
- **Pharmacy QR-code push:** NCC-PvPI proposed that every pharmacy and chemist shop display a PvPI QR code and the toll-free number to help consumers report. Goa FDA circular, 2025: https://dfda.goa.gov.in/wp-content/uploads/2025/09/Display-of-QR-Code-and-PvPI-Toll-Free-number-in-Pharmacy-or-Chemist-Shops-across-the-country-to-facilitate-ADR-reporting-by-consumers.pdf (2025). Nationwide rollout status is unverified.
- **PvPI signals have led to action.** PvPI has made 182 drug safety alerts, 66 package-insert updates and 16 confirmed signals to CDSCO. Examples include Paracetamol, Ibuprofen and Aceclofenac with fixed drug eruption, and Gliclazide with erythema multiforme. PvPI Profile 2025 (2025)
- **Digital India direction:** the ADRMS online portal was launched 19 Aug 2024 by the Health Minister. PvPI Profile 2025 (2024)
- **Unverified:** "only 5–10% of suspected side effects get reported" is attributed to IPC in search snippets, but the IPC news page returned HTTP 500 and I could not read it. Use the global Hazell & Shakir figure below instead.

## 2. Global / WHO context

- **Median ADR under-reporting is 94%** (IQR 82–98%) across 37 studies in 12 countries. Even for serious ADRs it is 85%.
  Hazell & Shakir, *Drug Safety* 2006;29(5):385–96: https://pubmed.ncbi.nlm.nih.gov/16689555/ (2006)
- **6.5% of hospital admissions were caused by ADRs** in a prospective study of 18,820 patients. These used 4% of bed capacity, at a projected £466m a year to the NHS. Common culprits were low-dose aspirin, diuretics, warfarin and NSAIDs.
  Pirmohamed et al., *BMJ* 2004;329:15: https://pubmed.ncbi.nlm.nih.gov/15231615/ (2004)
  - A 2022 follow-up at the same trust found about 16.5% (2019 sample): https://news.liverpool.ac.uk/2022/07/05/study-highlights-rising-tide-in-adverse-drug-reactions/ (2022)
- **The global cost of medication errors is about US$42 billion a year.** WHO's "Medication Without Harm" challenge, launched 29 Mar 2017, aims to cut severe avoidable medication-related harm by 50%.
  WHO: https://www.who.int/initiatives/medication-without-harm (2017)
- **Why post-market reporting matters (WHO):** trials are small and short, and "certain side effects may only emerge once these products have been used by a heterogenous population."
  WHO Pharmacovigilance team page: https://www.who.int/teams/regulation-prequalification/regulation-and-safety/pharmacovigilance (accessed 2026)
- **WHO benchmark: 200 spontaneous reports per million population per year** (WHO, 2000, as cited in Pham et al. 2024 below). Viet Nam received 177–199 per million, still below that benchmark. https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2024.1420914/full (2024)

## 3. The UNDP / Viet Nam model (and the UNDP-backed app evidence)

**What I could verify about Viet Nam:**
- **UNDP Viet Nam runs a Joint UNDP/WHO Programme on Access to Quality Medical Products.** Under its "Institutional Governance & Regulation" pillar, it works with Viet Nam's **National Centre of Drug Information and Adverse Drug Reactions Monitoring (National DI & ADR Centre)** on the **"Digitalisation of National ADR Pharmacovigilance System"**. The listed components are Data Standardisation, Database, Report Entry, Incorporate AI for Analysis, and Data Transfer to Global Database. Further workstreams are policy and legal frameworks, information systems and digital solutions, and health workforce capacity.
  UNDP Viet Nam slides (Dr Chris McBrearty, Health Governance Specialist, UNDP Viet Nam) in the UNDP HIV/Health and Digital Communities of Practice deck, Oct 2025: https://www.sparkblue.org/system/files/2025-10/CoP%20Health%20Presentation%20Template.pdf (2025)
- Viet Nam's national DI & ADR centre has accepted online ADR reports since 2014. Signals from its national database have led to national regulatory actions.
  Nguyen et al., "Overview of Pharmacovigilance System in Vietnam", *Drug Safety* 2018: https://link.springer.com/article/10.1007/s40264-017-0598-y (2017/2018)
- Viet Nam receives 177–199 reports per million a year (2021–2022), below the WHO benchmark of 200. A multifaceted hospital intervention raised spontaneous reports by 31% in 3 months. Pham et al., *Front. Pharmacol.* 2024: https://www.frontiersin.org/journals/pharmacology/articles/10.3389/fphar.2024.1420914/full (2024)

**Unverified:** I found no published **results or impact numbers** for the UNDP Viet Nam digitalisation work, such as reports before and after, or a launch date. The deck lists components but no outcomes. I also found no UNDP Viet Nam press release on it. If the brief cites specific Viet Nam results, ask the organisers for their source.

**Verified UNDP-backed analogue with results (use this for the "it works" slide):**
- **Ghana, 2019:** the FDA Ghana launched the **Med Safety app** for consumers, patients and health workers to report side effects. It came through the Access and Delivery Partnership (ADP), implemented by **UNDP**, WHO, TDR and PATH and funded by Japan, with WEB-RADR and the UK MHRA. ADP trained over 1,000 people in reporting between 2017 and 2019.
  UNDP Ghana, 17 Aug 2019: https://www.undp.org/ghana/news/med-safety-app-reporting-side-effects-medicines-and-other-health-products-ghana (2019)
- **Evidence that an app increases reporting:** in a cluster-RCT in Uganda (367 facilities, 2,464 health workers), the Med Safety app **raised ADR reporting by 73%**. The rate was 10.6 vs 5.9 per 100,000 person-months, IRR 1.73 (95% CI 1.26–2.37), p=0.001. Non-serious ADR reports nearly doubled (IRR 1.97). The increase in serious ADR reports was not significant.
  *Lancet Global Health* 2025;13(10):e1761–70: https://pmc.ncbi.nlm.nih.gov/articles/PMC12446902/ (2025)
- The Med Safety app has been rolled out in 18 countries (WEB-RADR / IHI): https://www.ihi.europa.eu/news-events/newsroom/medicine-safety-app-reporting-drug-side-effects-rolled-out-18-countries (year not checked)

## 4. SDG mapping

Official target text: https://sdgs.un.org/goals/goal3

- **Primary: SDG 3.8.** "Achieve universal health coverage, including financial risk protection, access to quality essential health-care services and access to **safe, effective, quality and affordable essential medicines and vaccines for all**." An ADR app supports the *safe* part of that target. UNDP Ghana explicitly linked ADR reporting to this target in 2019 (source above).
- **Secondary: SDG 3.d.** "Strengthen the capacity of all countries, in particular developing countries, for **early warning, risk reduction and management of national and global health risks**." Pharmacovigilance is a drug-safety early-warning system: PvPI signals lead to CDSCO alerts and label changes.
- **SDG 3.b (weaker fit):** it is about R&D of and access to medicines and vaccines (TRIPS). Use it only as a stretch link through post-marketing safety data.
- Also arguable: **SDG 9.c / 17.8** (ICT access and enabling technology). These are optional.

**Slide recommendation:** lead with **3.8**, support with **3.d**.
