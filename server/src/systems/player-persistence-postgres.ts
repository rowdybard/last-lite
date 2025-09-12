import { Player } from '../shared/types.js';
import { DatabaseConnection } from '../database/config.js';

export interface PersistenceResult {
  success: boolean;
  reason?: string;
  playerId?: string;
}

export interface BackupResult {
  success: boolean;
  backupId?: string;
  playerCount?: number;
  reason?: string;
}

export interface RestoreResult {
  success: boolean;
  reason?: string;
}

export class PlayerPersistencePostgres {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  async savePlayer(player: Player): Promise<PersistenceResult> {
    try {
      // Validate player data
      const validation = this.validatePlayer(player);
      if (!validation.valid) {
        return { success: false, reason: validation.reason };
      }

      // Convert ability cooldowns Map to object for JSON storage
      const abilityCooldownsObj: Record<string, number> = {};
      if (player.abilityCooldowns) {
        Object.entries(player.abilityCooldowns).forEach(([key, value]) => {
          abilityCooldownsObj[key] = value as number;
        });
      }

      const query = `
        INSERT INTO players (
          id, name, class, level, xp, pos_x, pos_y, pos_z, vel_vx, vel_vz, dir, anim,
          hp, max_hp, mp, max_mp, gold, buffs, debuffs, ability_cooldowns, inventory, last_gcd, last_activity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          class = EXCLUDED.class,
          level = EXCLUDED.level,
          xp = EXCLUDED.xp,
          pos_x = EXCLUDED.pos_x,
          pos_y = EXCLUDED.pos_y,
          pos_z = EXCLUDED.pos_z,
          vel_vx = EXCLUDED.vel_vx,
          vel_vz = EXCLUDED.vel_vz,
          dir = EXCLUDED.dir,
          anim = EXCLUDED.anim,
          hp = EXCLUDED.hp,
          max_hp = EXCLUDED.max_hp,
          mp = EXCLUDED.mp,
          max_mp = EXCLUDED.max_mp,
          gold = EXCLUDED.gold,
          buffs = EXCLUDED.buffs,
          debuffs = EXCLUDED.debuffs,
          ability_cooldowns = EXCLUDED.ability_cooldowns,
          inventory = EXCLUDED.inventory,
          last_gcd = EXCLUDED.last_gcd,
          last_activity = EXCLUDED.last_activity,
          updated_at = NOW()
      `;

      const values = [
        player.id,
        player.name,
        player.class,
        player.level,
        player.xp,
        player.pos.x,
        player.pos.y,
        player.pos.z,
        player.vel.vx || 0,
        player.vel.vz || 0,
        player.dir || 0,
        player.anim || 'idle',
        player.hp,
        player.maxHp,
        player.mp,
        player.maxMp,
        player.gold,
        JSON.stringify(player.buffs || {}),
        JSON.stringify(player.debuffs || {}),
        JSON.stringify(abilityCooldownsObj),
        JSON.stringify(player.inventory),
        player.lastGcd || 0,
        new Date(player.lastActivity)
      ];

      await this.db.query(query, values);
      
      return { success: true, playerId: player.id };
    } catch (error) {
      return { success: false, reason: 'Failed to save player: ' + error };
    }
  }

  async loadPlayer(playerId: string): Promise<Player | null> {
    try {
      const query = 'SELECT * FROM players WHERE id = $1';
      const result = await this.db.query(query, [playerId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return this.rowToPlayer(row);
    } catch (error) {
      console.error('Error loading player:', error);
      return null;
    }
  }

  async deletePlayer(playerId: string): Promise<PersistenceResult> {
    try {
      const query = 'DELETE FROM players WHERE id = $1';
      const result = await this.db.query(query, [playerId]);
      
      if (result.rowCount === 0) {
        return { success: false, reason: 'Player not found' };
      }

      return { success: true, playerId };
    } catch (error) {
      return { success: false, reason: 'Failed to delete player: ' + error };
    }
  }

  async listPlayers(): Promise<Player[]> {
    try {
      const query = 'SELECT * FROM players ORDER BY name';
      const result = await this.db.query(query);
      
      return result.rows.map((row: any) => this.rowToPlayer(row));
    } catch (error) {
      console.error('Error listing players:', error);
      return [];
    }
  }

  async findPlayerByName(name: string): Promise<Player | null> {
    try {
      const query = 'SELECT * FROM players WHERE name = $1';
      const result = await this.db.query(query, [name]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.rowToPlayer(result.rows[0]);
    } catch (error) {
      console.error('Error finding player by name:', error);
      return null;
    }
  }

  async createBackup(): Promise<BackupResult> {
    try {
      const backupId = this.generateBackupId();
      
      // Get all players
      const players = await this.listPlayers();
      
      // Store backup
      const query = 'INSERT INTO player_backups (backup_id, player_data) VALUES ($1, $2)';
      await this.db.query(query, [backupId, JSON.stringify(players)]);
      
      return { 
        success: true, 
        backupId, 
        playerCount: players.length 
      };
    } catch (error) {
      return { success: false, reason: 'Failed to create backup: ' + error };
    }
  }

  async restoreFromBackup(backupId: string): Promise<RestoreResult> {
    try {
      // Get backup data
      const query = 'SELECT player_data FROM player_backups WHERE backup_id = $1';
      const result = await this.db.query(query, [backupId]);
      
      if (result.rows.length === 0) {
        return { success: false, reason: 'Backup not found' };
      }

      const players: Player[] = result.rows[0].player_data;
      
      // Clear existing data
      await this.db.query('DELETE FROM players');
      
      // Restore players
      for (const player of players) {
        await this.savePlayer(player);
      }

      return { success: true };
    } catch (error) {
      return { success: false, reason: 'Failed to restore backup: ' + error };
    }
  }

  private rowToPlayer(row: any): Player {
    // Convert ability cooldowns object back to Record
    const abilityCooldowns: Record<string, number> = {};
    if (row.ability_cooldowns) {
      Object.entries(row.ability_cooldowns).forEach(([key, value]) => {
        abilityCooldowns[key] = value as number;
      });
    }

    return {
      id: row.id,
      name: row.name,
      class: row.class,
      level: row.level,
      xp: row.xp,
      pos: { x: row.pos_x, y: row.pos_y, z: row.pos_z },
      vel: { x: 0, y: 0, z: 0, vx: row.vel_vx, vz: row.vel_vz },
      dir: row.dir,
      anim: row.anim,
      hp: row.hp,
      maxHp: row.max_hp,
      mp: row.mp,
      maxMp: row.max_mp,
      gold: row.gold,
      buffs: row.buffs || {},
      debuffs: row.debuffs || {},
      abilityCooldowns,
      inventory: row.inventory || [],
      equipment: {},
      abilities: [],
      questLog: [],
      flags: {},
      lastActivity: new Date(row.last_activity).getTime(),
      lastGcd: row.last_gcd || 0
    };
  }

  private validatePlayer(player: Player): { valid: boolean; reason?: string } {
    if (!player.id || player.id.trim() === '') {
      return { valid: false, reason: 'Invalid player data: missing ID' };
    }

    if (!player.name || player.name.trim() === '') {
      return { valid: false, reason: 'Invalid player data: missing name' };
    }

    if (player.level < 1 || player.level > 100) {
      return { valid: false, reason: 'Invalid player data: level must be between 1 and 100' };
    }

    if (player.xp < 0) {
      return { valid: false, reason: 'Invalid player data: XP cannot be negative' };
    }

    if (player.hp < 0 || player.hp > player.maxHp) {
      return { valid: false, reason: 'Invalid player data: HP must be between 0 and maxHp' };
    }

    if (player.mp < 0 || player.mp > player.maxMp) {
      return { valid: false, reason: 'Invalid player data: MP must be between 0 and maxMp' };
    }

    if (player.gold < 0) {
      return { valid: false, reason: 'Invalid player data: gold cannot be negative' };
    }

    return { valid: true };
  }

  private generateBackupId(): string {
    return 'backup-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
}
