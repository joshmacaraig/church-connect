// supabase/generate-sql.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Read all SQL files
function generateCombinedSQL() {
  const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort to ensure correct order

  console.log('Generating combined SQL for Supabase setup...\n');

  let combinedSQL = '-- Combined SQL for Church Connect Supabase Setup\n\n';

  // Process each file
  migrationFiles.forEach(file => {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    combinedSQL += `-- ==========================================\n`;
    combinedSQL += `-- File: ${file}\n`;
    combinedSQL += `-- ==========================================\n\n`;
    combinedSQL += sql;
    combinedSQL += '\n\n';
  });

  // Write to a file for easy copy-paste
  const outputPath = path.join(__dirname, 'combined-setup.sql');
  fs.writeFileSync(outputPath, combinedSQL);

  console.log('Combined SQL has been generated in: supabase/combined-setup.sql');
  console.log('Instructions:');
  console.log('1. Open the file: supabase/combined-setup.sql');
  console.log('2. Copy the contents of the file');
  console.log('3. Go to your Supabase dashboard > SQL Editor');
  console.log('4. Create a new query and paste the SQL');
  console.log('5. Run the query to set up your database');
  console.log('\nAfter running the SQL, create the storage buckets:');
  console.log('1. Go to Storage in the Supabase dashboard');
  console.log('2. Create buckets named: avatars, church-logos, and song-attachments');
}

// Run the function
generateCombinedSQL();
