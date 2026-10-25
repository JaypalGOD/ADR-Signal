-- Optional PvPI form details read from photos and descriptions.
ALTER TABLE reports
  ADD COLUMN manufacturer TEXT,
  ADD COLUMN expiry_date TEXT,
  ADD COLUMN dose TEXT,
  ADD COLUMN indication TEXT,
  ADD COLUMN started_on TEXT,
  ADD COLUMN stopped_on TEXT,
  ADD COLUMN action_taken TEXT,
  ADD COLUMN rechallenge TEXT,
  ADD COLUMN other_medicines TEXT,
  ADD COLUMN medical_history TEXT,
  ADD COLUMN weight_kg REAL;
