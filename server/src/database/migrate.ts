import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DatabaseConnection } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class DatabaseMigrator {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  async runMigrations(): Promise<void> {
    try {
      console.log('Starting database migrations...');
      
      // Read the schema file
      const schemaPath = join(__dirname, 'schema.sql');
      const schema = readFileSync(schemaPath, 'utf8');
      
      // Execute the schema
      await this.db.query(schema);
      
      console.log('Database migrations completed successfully');
    } catch (error) {
      console.error('Database migration failed:', error);
      throw error;
    }
  }

  async checkTablesExist(): Promise<boolean> {
    try {
      const result = await this.db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'players', 'world_entities', 'player_backups', 'world_backups')
      `);
      
      return result.rows.length === 5;
    } catch (error) {
      console.error('Error checking tables:', error);
      return false;
    }
  }

  async dropAllTables(): Promise<void> {
    try {
      console.log('Dropping all tables...');
      
      await this.db.query('DROP TABLE IF EXISTS world_backups CASCADE');
      await this.db.query('DROP TABLE IF EXISTS player_backups CASCADE');
      await this.db.query('DROP TABLE IF EXISTS world_entities CASCADE');
      await this.db.query('DROP TABLE IF EXISTS players CASCADE');
      await this.db.query('DROP TABLE IF EXISTS users CASCADE');
      await this.db.query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE');
      
      console.log('All tables dropped successfully');
    } catch (error) {
      console.error('Error dropping tables:', error);
      throw error;
    }
  }
}
