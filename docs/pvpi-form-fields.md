# PvPI ADR reporting forms: field reference

Researched 2026-10-22. Field names are copied from the official forms. `*` = mandatory.

## Sources

| ID | Document | URL |
|----|----------|-----|
| S1 | Suspected ADR Reporting Form for Healthcare Professionals, **Version 1.4** (IPC). The copy is hosted by Zuventus, and the same form is reproduced in the IPC profile (S3). | https://www.zuventus.com/sites/default/files/2025-02/ADR_Reporting_Form_English%20V1.4.pdf |
| S2 | Suspected ADR Reporting Form, **Version 1.2** (older, includes the "Advice about reporting" page with the mandatory-field list) | https://website.aiimsraipur.edu.in/Downloads/ADR%20Reporting%20form%20for%20Health%20Professionals.pdf |
| S3 | PvPI Information Profile, NCC-PvPI/IPC, Sept 2025 (reproduces both the v1.4 HCP form and the consumer form) | https://www.ipc.gov.in/images/PvPI_Profile_-_19.9.2025.pdf |
| S4 | Medicines Side Effect Reporting Form (For Consumers), **Version 1.0**, Tamil/English bilingual edition on ipc.gov.in | https://ipc.gov.in/PvPI/adr/Tamil.pdf |
| S5 | PvPI FAQ (IPC) | https://www.ipc.gov.in/PvPI/faq.html |
| S6 | IPC news: helpline relaunched as multilingual IVRS | https://ipc.gov.in/news-highlights/1399-ipc-expands-helpline-number-1800-180-3024-multilingual-ivr-system.html |
| S7 | IPC ADR reporting forms page. It lists the HCP v1.4 form, the consumer form, the COVID-19 form and the AEFI form. It returned HTTP 500 when fetched, so it was seen only in search results. | https://www.ipc.gov.in/8-category-en/865-adr-reporting-forms.html |

---

## 1. Healthcare Professional form: "Suspected Adverse Drug Reaction Reporting Form" (v1.4)

Header: "For VOLUNTARY reporting of ADRs by Healthcare Professionals", Indian Pharmacopoeia Commission (NCC-PvPI), Ghaziabad (S1).

**Mandatory fields, as stated on the form (S2, section E):** "Patient initials, age at onset of reaction, reaction term(s), date of onset of reaction, suspected medication(s) and reporter information."
On v1.4 the section headers A, B, C and D each carry an asterisk, with the footnote "* Mandatory Fields for suspected ADR Reporting Form" (S1). The form asterisks whole sections. The field-level list above is the authoritative one.

### Report type
| Field | Type | Mandatory |
|---|---|---|
| Initial Case / Follow-up Case | checkbox | no |

### A. Patient information *
| # | Field | Type | Mandatory |
|---|---|---|---|
| 1 | Patient Initials | text | **yes** |
| 2 | Age or date of birth | number / date | **yes** (age at onset of reaction) |
| 3 | Gender: M / F / Other | radio | no |
| 4 | Weight (in Kg.) | number | no |

### B. Suspected adverse reaction *
| # | Field | Type | Mandatory |
|---|---|---|---|
| 5 | Event / Reaction start date (dd/mm/yyyy) | date | **yes** (date of onset) |
| 6 | Event / Reaction stop date (dd/mm/yyyy) | date | no |
| 7 | Describe Event/Reaction management with details, if any | long text | **yes** (reaction term(s)) |
| 12 | Relevant investigations with dates | long text | no |
| 13 | Relevant medical / medication history (e.g. allergies, pregnancy, addiction, hepatic, renal dysfunction etc.) | long text | no |
| 14 | Seriousness of the reaction: No / Yes. If Yes, tick one: Death (dd/mm/yyyy), Life threatening, Hospitalization-Initial/Prolonged, Disability, Congenital-anomaly, Other Medically important | radio + date | no |
| 15 | Outcome: Recovered / Recovering / Not Recovered / Fatal / Recovered with sequelae / Unknown | radio | no |

(Fields 12 to 15 sit in the right-hand column of the paper form but describe the reaction and patient.)

### C. Suspected medication(s) * (rows i to iv)
| # | Field | Type | Mandatory |
|---|---|---|---|
| 8 | Name (Brand / Generic) | text | **yes** |
| 8 | Manufacturer (if known) | text | no |
| 8 | Batch No. / Lot No. | text | no |
| 8 | Expiry Date (if known) | date | no |
| 8 | Dose | text | no |
| 8 | Route | text/select | no |
| 8 | Frequency (OD, BD etc.) | select | no |
| 8 | Therapy dates: Date Started / Date Stopped | date | no |
| 8 | Indication | text | no |
| 8 | Causality Assessment | select | no. Filled by the AMC using the WHO-UMC scale (S2, section D) |
| 9 | Action taken after reaction (per drug row): Drug withdrawn / Dose increased / Dose reduced / Dose not changed / Not applicable / Unknown | radio | no |
| 10 | Reaction reappeared after reintroduction of suspected medication: Yes / No / Effect unknown, plus Dose (if re-introduced) | radio + text | no |
| 11 | Concomitant medical product including self-medication and herbal remedies with therapy dates (exclude those used to treat reaction). Rows i to iii: Name (Brand/Generic), Dose, Route, Frequency, Date Started, Date Stopped, Indication | table | no |
| - | Additional Information | long text | no |

### D. Reporter details *
| # | Field | Type | Mandatory |
|---|---|---|---|
| 16 | Name & Address | text | **yes** |
| 16 | Pin | text | **yes** (part of reporter information) |
| 16 | Email | email | **yes** (part of reporter information) |
| 16 | Contact No. | tel | **yes** (part of reporter information) |
| 16 | Occupation | text | **yes** (part of reporter information) |
| 16 | Signature | signature | **yes** (part of reporter information) |
| 17 | Date of this report (dd/mm/yyyy) | date | no |

The form groups these sub-fields as "reporter information". It does not say which individual sub-fields are required, so treat at least name plus one contact method as required. That rule is an inference, not stated on the form.

### For AMC / NCC use only (not for reporters)
Reg. No. / IPD No. / OPD No. / CR No.; AMC Report No.; Worldwide Unique No.; Signature and Name of Receiving Personnel (S1).

### Notes printed on the form
- Confidentiality: patient identity is held in strict confidence. Submitting a report "does not constitute an admission" that anyone caused the reaction, and v1.4 adds that an ADR report "does not have any legal implication on the reporter" (S1).
- Who can report: clinicians, dentists, pharmacists and nurses (S2). The FAQ adds patients/consumers (S5).
- Routing: the form goes to the nearest ADR Monitoring Centre (AMC) or directly to NCC. AMCs assess causality using the WHO-UMC scale and send the data on to WHO-UMC's global database (VigiBase) in Uppsala (S2, S3).

---

## 2. Consumer form: "Medicines Side Effect Reporting Form (For Consumers)" (v1.0, the "blue form")

This is a separate, simpler form for patients. It is available in 10 Indian languages: Hindi, Bengali, Gujarati, Kannada, Malayalam, Marathi, Assamese, Oriya, Tamil and Telugu (S3). Fields below are taken from the bilingual form (S4) and the copy in S3.

**Mandatory fields: unverified.** The consumer form carries no asterisks. It says "Please do report even if you do not have all the information" (S4). The only field it labels as optional is the reporter's *Name (Optional)*. It also says name/address/telephone/email "are necessary to assess the report" (S4, instructions section 3). A published study refers to "mandatory fields" on this form but I could not open it to see which ones (https://pmc.ncbi.nlm.nih.gov/articles/PMC12662611/).

### 1. Patient details
| Field | Type | Note |
|---|---|---|
| Patient Initials | text | instruction: first letter of name + first letter of surname, e.g. Pradeep Sharma = PS |
| Gender: Male / Female / Other | radio | |
| Age (Year or Month) | number + unit | |

### 2. Health information
| Field | Type |
|---|---|
| a. Reason(s) for taking medicine(s) (Disease/Symptoms) | text |
| b. Medicines Advised by: Doctor / Pharmacist / Friends/Relatives / Self (Past disease experienced / No past disease experienced) | radio |

### 3. Details of person reporting the side effect
| Field | Type | Note |
|---|---|---|
| a. Name | text | marked **(Optional)** |
| b. Address | text | stated as necessary to assess the report |
| Telephone No. | tel | stated as necessary to assess the report |
| Email | email | stated as necessary to assess the report |

### 4. Details of medicine taking/taken (table)
| Field | Type |
|---|---|
| Name of Medicines | text |
| Quantity of Medicines taken (e.g. 250 mg, Two times a day) | text |
| Expiry Date of Medicines | date |
| Date of Start of Medicines (dd/mm/yy) | date |
| Date of Stop of Medicines (dd/mm/yy) | date |
| Dosage form: Tablet / Capsule / Injection / Oral Liquids / Others (please specify) | radio + text |

### 5. About the side effect
| Field | Type |
|---|---|
| When did the side effect start? (dd/mm/yy) | date |
| When did the side effect stop? (dd/mm/yy) | date |
| Side Effect is still Continuing: Yes / No | radio |

### 6. How bad was the side effect? (tick all that apply)
Did not affect daily activities / Affect daily activities / Admitted to hospital / Death / Others

### 7. Describe the side effect (What did you do to manage the side effect?)
Long text.

Footer: reporting "is voluntary, has no legal implication". The information is forwarded to an AMC for follow-up (S4).

---

## 3. Other PvPI reporting channels

| Item | Value | Source |
|---|---|---|
| **PvPI Helpline (toll free)** | **1800-180-3024**. Hours are 9:00 AM to 5:30 PM, Monday to Friday. Callers can leave a voice message when no one answers. | S1, S5 |
| Helpline upgrade | Relaunched as an IVRS for reporting ADRs to medicines, vaccines and medical devices in **10 languages** | S6 |
| **Mobile app** | **"ADR PvPI"** (Android, Google Play) per the FAQ. The Sept 2025 IPC profile calls it **"ADR PvPI 2.0"**. I did not confirm whether an iOS version exists. | S5, S3 |
| Online portal | **ADRMS (Adverse Drug Reaction Monitoring System)**, launched 19 Aug 2024 by Health Minister J.P. Nadda. IPC calls it "India's first comprehensive medical product safety database" | S3 |
| Email | `pvpi.ipc@gov.in` (current, per the Sept 2025 profile). Older forms list pvpi@ipcindia.net, pvpi.ipcindia@gmail.com and pvpi.compat@gmail.com (consumer form). | S3, S2, S4 |
| Postal | NCC-PvPI, Indian Pharmacopoeia Commission, Sector-23, Raj Nagar, Ghaziabad-201002, UP. Tel 0120-2783400, 2783401, 2783392 | S1, S3 |
| Other forms | Suspected ADR form for drugs used for COVID-19; Medical Device AE forms (MvPI); PPE AE form; Kala-azar ADR form; Serious AEFI notification form | S3 |

## 4. Implications for the app's data model
- **Minimum valid report** (HCP mandatory list, S2): patient initials, age at onset, reaction term(s), date of onset, suspected medicine(s), reporter information. Validate only these and let everything else be optional.
- Consumer mode should follow the consumer form. "Medicines advised by" and "How bad was it" have no HCP equivalent, and the reporter name is optional.
- Map consumer "How bad" to HCP field 14 like this: Admitted to hospital = Hospitalization, Death = Death. This mapping is our own design, not PvPI's.
- Leave Causality Assessment out of the reporter UI. The AMC fills it in (S2).
