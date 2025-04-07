// supabase/setup.js

/**
 * Supabase Setup Helper
 * 
 * This file provides helper functions for setting up Supabase for your Church Connect app.
 * Run these functions to initialize your Supabase project with the necessary tables, 
 * storage buckets, and security policies.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * Initialize Supabase with the proper schema and policies
 * @param {string} supabaseUrl - Your Supabase URL
 * @param {string} supabaseKey - Your Supabase service role key (not anon key)
 * @returns {Promise<Object>} - Setup results
 */
export async function initializeSupabase(supabaseUrl, supabaseKey) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and service role key are required');
  }

  // Create a Supabase client with the service role key
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Get all migration files
  const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort to ensure correct order

  const results = {
    success: true,
    migrations: [],
    errors: []
  };

  // Run each migration file
  for (const file of migrationFiles) {
    try {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`Running migration: ${file}`);
      const { error } = await supabase.rpc('exec_sql', { query: sql }).catch(err => ({ error: err }));

      if (error) {
        console.error(`Error in migration ${file}:`, error);
        results.success = false;
        results.errors.push({ file, error: error.message });
      } else {
        console.log(`Migration ${file} completed successfully`);
        results.migrations.push(file);
      }
    } catch (err) {
      console.error(`Error processing migration ${file}:`, err);
      results.success = false;
      results.errors.push({ file, error: err.message });
    }
  }

  return results;
}

/**
 * Create the necessary storage buckets
 * @param {Object} supabase - Supabase client
 * @returns {Promise<Object>} - Setup results
 */
export async function setupStorageBuckets(supabaseUrl, supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const buckets = [
    {
      id: 'avatars',
      public: true,
      options: {
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],
        maxFileSize: 5 * 1024 * 1024 // 5MB
      }
    },
    {
      id: 'church-logos',
      public: true,
      options: {
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'],
        maxFileSize: 5 * 1024 * 1024 // 5MB
      }
    },
    {
      id: 'song-attachments',
      public: false,
      options: {
        allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'audio/mpeg'],
        maxFileSize: 20 * 1024 * 1024 // 20MB
      }
    }
  ];

  const results = {
    success: true,
    buckets: [],
    errors: []
  };

  for (const bucket of buckets) {
    try {
      console.log(`Creating bucket: ${bucket.id}`);
      const { data, error } = await supabase.storage.createBucket(
        bucket.id, 
        { 
          public: bucket.public,
          fileSizeLimit: bucket.options.maxFileSize,
          allowedMimeTypes: bucket.options.allowedMimeTypes
        }
      );

      if (error && error.code !== '23505') { // Ignore "already exists" error
        console.error(`Error creating bucket ${bucket.id}:`, error);
        results.success = false;
        results.errors.push({ bucket: bucket.id, error: error.message });
      } else {
        console.log(`Bucket ${bucket.id} created or already exists`);
        results.buckets.push(bucket.id);
      }
    } catch (err) {
      console.error(`Error creating bucket ${bucket.id}:`, err);
      results.success = false;
      results.errors.push({ bucket: bucket.id, error: err.message });
    }
  }

  return results;
}

/**
 * Verify that the Supabase setup is complete
 * @param {string} supabaseUrl - Your Supabase URL
 * @param {string} supabaseKey - Your Supabase service role key (not anon key)
 * @returns {Promise<Object>} - Verification results
 */
export async function verifySetup(supabaseUrl, supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const results = {
    success: true,
    tables: {
      expected: [
        'profiles', 
        'churches', 
        'worship_teams', 
        'team_members',
        'events',
        'songs',
        'event_songs',
        'prayer_requests'
      ],
      found: []
    },
    buckets: {
      expected: ['avatars', 'church-logos', 'song-attachments'],
      found: []
    },
    errors: []
  };

  // Check tables
  try {
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    if (error) {
      console.error('Error checking tables:', error);
      results.success = false;
      results.errors.push({ context: 'tables', error: error.message });
    } else {
      results.tables.found = data.map(t => t.tablename);
      
      // Check if all expected tables exist
      const missingTables = results.tables.expected.filter(t => !results.tables.found.includes(t));
      if (missingTables.length > 0) {
        console.warn('Missing tables:', missingTables);
        results.success = false;
        results.errors.push({ 
          context: 'tables', 
          error: `Missing tables: ${missingTables.join(', ')}` 
        });
      }
    }
  } catch (err) {
    console.error('Error checking tables:', err);
    results.success = false;
    results.errors.push({ context: 'tables', error: err.message });
  }

  // Check storage buckets
  try {
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('Error checking storage buckets:', error);
      results.success = false;
      results.errors.push({ context: 'buckets', error: error.message });
    } else {
      results.buckets.found = data.map(b => b.name);
      
      // Check if all expected buckets exist
      const missingBuckets = results.buckets.expected.filter(b => !results.buckets.found.includes(b));
      if (missingBuckets.length > 0) {
        console.warn('Missing buckets:', missingBuckets);
        results.success = false;
        results.errors.push({ 
          context: 'buckets', 
          error: `Missing buckets: ${missingBuckets.join(', ')}` 
        });
      }
    }
  } catch (err) {
    console.error('Error checking storage buckets:', err);
    results.success = false;
    results.errors.push({ context: 'buckets', error: err.message });
  }

  return results;
}

/**
 * Run the complete Supabase setup
 * @param {string} supabaseUrl - Your Supabase URL
 * @param {string} supabaseKey - Your Supabase service role key (not anon key)
 * @returns {Promise<Object>} - Setup results
 */
export async function setupSupabase(supabaseUrl, supabaseKey) {
  console.log('Starting Supabase setup...');
  
  // Run migrations
  console.log('Running database migrations...');
  const migrationResults = await initializeSupabase(supabaseUrl, supabaseKey);
  
  // Set up storage buckets
  console.log('Setting up storage buckets...');
  const bucketResults = await setupStorageBuckets(supabaseUrl, supabaseKey);
  
  // Verify the setup
  console.log('Verifying setup...');
  const verificationResults = await verifySetup(supabaseUrl, supabaseKey);
  
  return {
    migrations: migrationResults,
    buckets: bucketResults,
    verification: verificationResults,
    success: migrationResults.success && bucketResults.success && verificationResults.success
  };
}

// If this script is run directly (not imported)
if (typeof require !== 'undefined' && require.main === module) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set');
    process.exit(1);
  }
  
  setupSupabase(supabaseUrl, supabaseKey)
    .then(results => {
      console.log('\nSetup results:', JSON.stringify(results, null, 2));
      
      if (results.success) {
        console.log('\n✅ Supabase setup completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Update your .env file with your Supabase URL and anon key');
        console.log('2. Start your application with "npm run dev"');
      } else {
        console.error('\n❌ Supabase setup completed with errors. See above for details.');
      }
    })
    .catch(err => {
      console.error('Error during setup:', err);
      process.exit(1);
    });
}
