// Test script to verify PostgreSQL connection to Render database
require('./test-config.js');

const { DatabaseConnection } = require('./dist/database/config');
const { DatabaseMigrator } = require('./dist/database/migrate');

async function testConnection() {
  console.log('Testing PostgreSQL connection to Render database...');
  console.log('Database URL:', process.env.DATABASE_URL);
  
  try {
    const db = DatabaseConnection.getInstance();
    
    // Test basic connection
    console.log('Testing basic connection...');
    const connected = await db.testConnection();
    if (connected) {
      console.log('✅ Database connection successful!');
    } else {
      console.log('❌ Database connection failed!');
      return;
    }
    
    // Run migrations
    console.log('Running database migrations...');
    const migrator = new DatabaseMigrator();
    await migrator.runMigrations();
    console.log('✅ Database migrations completed!');
    
    // Verify tables exist
    console.log('Verifying tables exist...');
    const tablesExist = await migrator.checkTablesExist();
    if (tablesExist) {
      console.log('✅ All database tables created successfully!');
    } else {
      console.log('❌ Database tables not created properly!');
    }
    
    // Test a simple query
    console.log('Testing simple query...');
    const result = await db.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Query successful!');
    console.log('Current time:', result.rows[0].current_time);
    console.log('PostgreSQL version:', result.rows[0].postgres_version);
    
    await db.close();
    console.log('✅ Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

testConnection();
