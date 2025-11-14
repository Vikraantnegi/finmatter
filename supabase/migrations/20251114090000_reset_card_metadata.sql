-- Reset card metadata and BIN cache
-- Truncate data so we can rebuild with verified sources

DELETE FROM bin_lookup;
DELETE FROM cards_metadata;
