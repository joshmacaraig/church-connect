-- Check the structure of the churches table
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'churches'
ORDER BY ordinal_position;
