# Turns PvPI's official AMC list (PDF) into client/public/amc.json for the "See a doctor" step.
# Source: https://ipc.gov.in/images/pvpi/1300-AMC-Details-As-on-September-2026.pdf (linked from
# https://www.ipc.gov.in/mandates/pvpi/adr-monitoring-centers.html).
# Run: python -I data/reference/amc/parse_amc.py <pdf> data/reference/amc/amc.json client/public/amc.json
# Keeps only state, centre name/address, ownership and AMC ID; coordinators' personal names are dropped.
import json, re, sys
import pypdf

STATES = ['Andaman & Nicobar', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
          'Dadra & Nagar Haveli and Daman & Diu', 'Dadra and Nagar Haveli and Daman and Diu', 'Dadra & Nagar Haveli', 'Daman & Diu',
          'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir', 'Jammu and Kashmir', 'Jharkhand',
          'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
          'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
          'Uttar Pradesh', 'Uttarakhand', 'West Bengal']
# Spellings that appear in the PDF itself, mapped to the canonical state name
ALIASES = {'Chaattisgarh': 'Chhattisgarh', 'Keralam': 'Kerala', 'Orissa': 'Odisha', 'Pondicherry': 'Puducherry',
           'Telengana': 'Telangana', 'Uttaranchal': 'Uttarakhand', 'Tamilnadu': 'Tamil Nadu', 'New Delhi': 'Delhi', 'NCT of Delhi': 'Delhi',
           'Jammu and Kashmir': 'Jammu & Kashmir', 'Dadra and Nagar Haveli and Daman and Diu': 'Dadra & Nagar Haveli and Daman & Diu',
           'UT of Dadra and Nagar Haveli & Daman and Diu': 'Dadra & Nagar Haveli and Daman & Diu'}
CANON = {re.sub(r'\s+', ' ', k).lower(): v for k, v in [*((s, s) for s in STATES), *ALIASES.items()]}
state_re = '|'.join(r'\s+'.join(map(re.escape, s.split())) for s in sorted([*STATES, *ALIASES], key=len, reverse=True))
ROW = re.compile(rf'(?mi)^(\d{{1,4}})\s+({state_re})\b')
# The ownership label is always followed by the AMC ID, which has a hyphen (GMC-Guntur). That rules out "Government"
# inside a centre's own name; Gov[a-z]{2,8}ment also covers the PDF's misspellings (Goverment, Govenrment).
STATUS = re.compile(r'\b(Non[- ]?Gov[a-z]{2,8}ment|(?:State|Central)[- ]Gov[a-z]{2,8}ment|Gov[a-z]{2,8}ment\s*\(?\s*(?:Central|State)?\s*\)?|Private|Autonomous)(?=\s+[A-Za-z0-9&/().]+\s*-)', re.I)
# A patient can be seen at a hospital or medical college, not at a pharmacy college
HOSPITAL = re.compile(r'medical|hospital|AIIMS|health|PGIMER|ESIC|clinic|institute of medical|nursing home|dispensary|sanatorium|chikitsalaya|cancer', re.I)

def clean_status(s):
    s = re.sub(r'\s+', ' ', s).strip().lower().replace('goverment', 'government')
    if s.startswith('non'): return 'Non-Government'
    if 'central' in s: return 'Government (Central)'
    if 'state' in s: return 'Government (State)'
    return s.capitalize() if s in ('private', 'autonomous') else 'Government'
PHARMACY_ONLY = re.compile(r'pharmac(y|eutical)', re.I)

text = '\n'.join(p.extract_text() or '' for p in pypdf.PdfReader(sys.argv[1]).pages)
starts = list(ROW.finditer(text))
rows, skipped = [], []
for i, m in enumerate(starts):
    chunk = text[m.end():starts[i + 1].start() if i + 1 < len(starts) else len(text)]
    st = STATUS.search(chunk)
    if not st:
        skipped.append(m.group(1)); continue
    name = re.sub(r'\s+', ' ', chunk[:st.start()]).strip(' ,')
    after = chunk[st.end():].split()
    rows.append({
        'no': int(m.group(1)), 'state': CANON[re.sub(r'\s+', ' ', m.group(2)).lower()], 'name': name,
        'status': clean_status(st.group(1)), 'id': after[0] if after else None,
        'hospital': bool(HOSPITAL.search(name)) and not (PHARMACY_ONLY.search(name) and not re.search(r'hospital|medical college', name, re.I)),
    })

json.dump(rows, open(sys.argv[2], 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
if len(sys.argv) > 3:   # compact file the website fetches: [state, name & address, 1 if government] for hospitals only
    web = [[r['state'], r['name'], int(r['status'].startswith('Gov'))] for r in rows if r['hospital']]
    json.dump(web, open(sys.argv[3], 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print(f'rows {len(rows)} | hospital {sum(r["hospital"] for r in rows)} | skipped {len(skipped)} {skipped[:15]} | last no. {starts[-1].group(1)}')
