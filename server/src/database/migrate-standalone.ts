#!/usr/bin/env node

import { DatabaseMigrator } from './migrate.js';

async function main() {
  try {
    console.log('🚀 Starting database migration...');
    
    const migrator = new DatabaseMigrator();
    
    // Check if tables already exist
    const tablesExist = await migrator.checkTablesExist();
    if (tablesExist) {
      console.log('✅ Database tables already exist, skipping migration');
      return;
    }
    
    // Run migrations
    await migrator.runMigrations();
    console.log('✅ Database migration completed successfully');
    
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    process.exit(1);
  }
}

main();
