// supabase/run-setup.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup function imported from setup.js - adjust path if needed
import { setupSupabase } from './setup.js';

// Supabase credentials
const SUPABASE_URL = 'https://xlsazndxtgqlsyohzjhp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsc2F6bmR4dGdxbHN5b2h6amhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg3NzcxMiwiZXhwIjoyMDU5NDUzNzEyfQ.BPfT-zQe6XhH0wQl_lge6undP9dAQGaIfS5ds6N7MVs';

// Run the setup
setupSupabase(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  .then(results => {
    console.log('\nSetup results:', JSON.stringify(results, null, 2));
    
    if (results.success) {
      console.log('\n✅ Supabase setup completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Your .env file has already been updated with your Supabase URL and anon key');
      console.log('2. Start your application with "npm run dev"');
    } else {
      console.error('\n❌ Supabase setup completed with errors. See above for details.');
    }
  })
  .catch(err => {
    console.error('Error during setup:', err);
    process.exit(1);
  });
