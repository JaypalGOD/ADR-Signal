# India boundary GeoJSON

Source repo: https://github.com/datta07/INDIAN-SHAPEFILES (MIT License, last pushed 2026-09)
Data is from Survey of India / LGD-based boundaries and reflects current districts (e.g. Andhra Pradesh's 26 districts after the 2022 reorganisation, J&K + Ladakh split, merged DNH & DD).

| File | Source URL | Size | Features |
|---|---|---|---|
| `india_districts.geojson` | https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/INDIA/INDIA_DISTRICTS.geojson | 77.8 MB | 820 |
| `india_districts.min.geojson` | made from the file above with `npx mapshaper@0.6 india_districts.geojson -simplify 10% keep-shapes -o india_districts.min.geojson precision=0.0001` | 4.2 MB | 820 |
| `india_states.geojson` | https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/INDIA/INDIA_STATES.geojson | 2.2 MB | 37 |

All files are WGS84 (lon/lat), so Leaflet can use them directly. Use the `.min` file in the app.

## Property keys

**Districts** (`india_districts*.geojson`): `objectid, statecode, district, state, shape_leng, shape_area, dist_code, D_CODE, st_code, remarks`
- District name: `district` (UPPERCASE, e.g. `"ALLURI SITHARAMA RAJU"`)
- State name: `state` (UPPERCASE, e.g. `"ANDHRA PRADESH"`)
- 792 real districts. 28 features have `district: null, state: null`, `D_CODE: "999"`, and `remarks: "DISPUTED (...)"`. These are small disputed border slivers, so filter them out or draw them grey.
- Watch for these names: `"ANDAMAN AND NICOBAR ISLANDS"`, `"JAMMU AND KASHMIR"`, `"DADRA & NAGAR HAVELI & DAMAN & DIU"`, and one feature `"GUJARAT and DNH & DD ISLANDS"` (district `ISLAND`).

**States** (`india_states.geojson`): `STNAME, STCODE11, STNAME_SH, Shape_Length, Shape_Area, OBJECTID_1, OBJECTID, State_LGD, Shape_Leng, MaxSimpTol, MinSimpTol`
- State name: `STNAME` (UPPERCASE) or `STNAME_SH` (Title Case)
- State LGD code: `State_LGD`
- These names do not match the district file in every case: the state file uses `ANDAMAN & NICOBAR`, `JAMMU & KASHMIR`, and separate `DADRA & NAGAR HAVELI` / `DAMAN & DIU`. Normalise names (`&` to `AND`, uppercase, trim) before joining ADR data to either file.

Simplification note: mapshaper repaired 11 self-intersections and left 88 unrepaired. That does not matter for drawing in Leaflet.
