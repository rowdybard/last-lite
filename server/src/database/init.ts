import { DatabaseConnection } from './config';
import { DatabaseMigrator } from './migrate';

export class DatabaseInitializer {
  private db: DatabaseConnection;
  private migrator: DatabaseMigrator;

  constructor() {
    this.db = DatabaseConnection.getInstance();
    this.migrator = new DatabaseMigrator();
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing database...');
      
      // Test connection
      const connected = await this.db.testConnection();
      if (!connected) {
        console.error('Failed to connect to database');
        return false;
      }
      
      console.log('Database connection successful');
      
      // Run migrations
      await this.migrator.runMigrations();
      
      // Verify tables exist
      const tablesExist = await this.migrator.checkTablesExist();
      if (!tablesExist) {
        console.error('Database tables not created properly');
        return false;
      }
      
      console.log('Database initialization completed successfully');
      return true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    await this.db.close();
  }
}
