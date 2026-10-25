-- When the report was emailed to the PvPI inbox; one email per report.
ALTER TABLE reports ADD COLUMN emailed_at TIMESTAMP;
