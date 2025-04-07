// supabase/update-env.js

/**
 * Update .env file with Supabase credentials
 * 
 * This script updates the .env file with your Supabase URL and anon key.
 * Run this script after setting up your Supabase project.
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function updateEnvFile() {
  console.log('Update Supabase credentials in .env file\n');
  
  // Get the Supabase URL and anon key from the user
  const supabaseUrl = await prompt('Enter your Supabase URL: ');
  const supabaseAnonKey = await prompt('Enter your Supabase anon key: ');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Supabase URL and anon key are required');
    rl.close();
    return;
  }
  
  // Path to .env file
  const envPath = path.join(process.cwd(), '..', '.env');
  
  try {
    // Read the current .env file
    let envContent = '';
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch (err) {
      // If the file doesn't exist, create it
      if (err.code === 'ENOENT') {
        envContent = '# Supabase connection details\n';
      } else {
        throw err;
      }
    }
    
    // Update the Supabase URL and anon key
    const updatedContent = envContent
      .replace(/VITE_SUPABASE_URL=.*/, `VITE_SUPABASE_URL=${supabaseUrl}`)
      .replace(/VITE_SUPABASE_ANON_KEY=.*/, `VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}`);
    
    // Write the updated content back to the .env file
    fs.writeFileSync(envPath, updatedContent);
    
    console.log('\n✅ .env file updated successfully!');
  } catch (err) {
    console.error('Error updating .env file:', err);
  } finally {
    rl.close();
  }
}

// If this script is run directly (not imported)
if (typeof require !== 'undefined' && require.main === module) {
  updateEnvFile();
}

export default updateEnvFile;
