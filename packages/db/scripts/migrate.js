#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    console.log(`📄 Running migration: ${file}`);
    
    const migrationPath = path.join(migrationsDir, file);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
      
      if (error) {
        console.error(`❌ Migration ${file} failed:`, error);
        process.exit(1);
      }
      
      console.log(`✅ Migration ${file} completed successfully`);
    } catch (err) {
      console.error(`❌ Migration ${file} failed:`, err);
      process.exit(1);
    }
  }
  
  console.log('🎉 All migrations completed successfully!');
}

// Create exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  const { error } = await supabase.rpc('exec_sql', { 
    sql: `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  });
  
  if (error && !error.message.includes('already exists')) {
    // If the function doesn't exist, we'll execute SQL directly
    console.log('Note: Using direct SQL execution');
  }
}

async function main() {
  try {
    await createExecSqlFunction();
    await runMigrations();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runMigrations };