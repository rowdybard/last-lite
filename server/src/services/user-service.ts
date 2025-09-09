import { DatabaseConnection } from '../database/config.js';
import bcrypt from 'bcrypt';

export interface User {
  username: string;
  password: string;
  characterName: string;
  characterClass: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRegistrationData {
  username: string;
  password: string;
  characterName: string;
  characterClass: string;
}

export class UserService {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  async createUser(data: UserRegistrationData): Promise<User> {
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    const query = `
      INSERT INTO users (username, password, character_name, character_class)
      VALUES ($1, $2, $3, $4)
      RETURNING username, password, character_name, character_class, created_at, updated_at
    `;

    const result = await this.db.query(query, [
      data.username,
      hashedPassword,
      data.characterName,
      data.characterClass
    ]);

    return this.mapRowToUser(result.rows[0]);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const query = `
      SELECT username, password, character_name, character_class, created_at, updated_at
      FROM users
      WHERE username = $1
    `;

    const result = await this.db.query(query, [username]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  async validatePassword(username: string, password: string): Promise<boolean> {
    const user = await this.getUserByUsername(username);
    if (!user) {
      return false;
    }

    return await bcrypt.compare(password, user.password);
  }

  async userExists(username: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM users WHERE username = $1
    `;

    const result = await this.db.query(query, [username]);
    return result.rows.length > 0;
  }

  async characterNameExists(characterName: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM users WHERE character_name = $1
    `;

    const result = await this.db.query(query, [characterName]);
    return result.rows.length > 0;
  }

  private mapRowToUser(row: any): User {
    return {
      username: row.username,
      password: row.password,
      characterName: row.character_name,
      characterClass: row.character_class,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
