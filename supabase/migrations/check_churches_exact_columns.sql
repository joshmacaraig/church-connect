-- Get the exact columns from the churches table
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'churches' 
ORDER BY ordinal_position;
