import { Entity, EntityType } from '../shared/types';
import { DatabaseConnection } from '../database/config';

export interface WorldPersistenceResult {
  success: boolean;
  reason?: string;
  zoneId?: string;
  entityCount?: number;
}

export interface WorldBackupResult {
  success: boolean;
  backupId?: string;
  zoneCount?: number;
  reason?: string;
}

export interface WorldRestoreResult {
  success: boolean;
  reason?: string;
}

export class WorldPersistencePostgres {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  async saveWorldState(zoneId: string, entities: Entity[]): Promise<WorldPersistenceResult> {
    try {
      // Validate zone ID
      if (!zoneId || zoneId.trim() === '') {
        return { success: false, reason: 'Invalid zone ID' };
      }

      // Validate entities
      for (const entity of entities) {
        const validation = this.validateEntity(entity);
        if (!validation.valid) {
          return { success: false, reason: validation.reason };
        }
      }

      // Delete existing entities for this zone
      await this.db.query('DELETE FROM world_entities WHERE zone_id = $1', [zoneId]);

      // Insert new entities
      if (entities.length > 0) {
        const values: any[] = [];
        const placeholders: string[] = [];
        
        entities.forEach((entity, index) => {
          const baseIndex = index * 13;
          placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11}, $${baseIndex + 12}, $${baseIndex + 13})`);
          
          values.push(
            entity.id,
            zoneId,
            entity.name,
            entity.type,
            entity.pos.x,
            entity.pos.y,
            entity.pos.z,
            entity.vel.vx,
            entity.vel.vz,
            entity.dir,
            entity.anim,
            entity.level,
            entity.hp,
            entity.maxHp,
            entity.spawnPos?.x || entity.pos.x,
            entity.spawnPos?.y || entity.pos.y,
            entity.spawnPos?.z || entity.pos.z,
            entity.leashDistance
          );
        });

        const query = `
          INSERT INTO world_entities (
            id, zone_id, name, type, pos_x, pos_y, pos_z, vel_vx, vel_vz, dir, anim,
            level, hp, max_hp, spawn_pos_x, spawn_pos_y, spawn_pos_z, leash_distance
          ) VALUES ${placeholders.join(', ')}
        `;

        await this.db.query(query, values);
      }
      
      return { success: true, zoneId, entityCount: entities.length };
    } catch (error) {
      return { success: false, reason: 'Failed to save world state: ' + error };
    }
  }

  async loadWorldState(zoneId: string): Promise<Entity[]> {
    try {
      const query = 'SELECT * FROM world_entities WHERE zone_id = $1 ORDER BY name';
      const result = await this.db.query(query, [zoneId]);
      
      return result.rows.map((row: any) => this.rowToEntity(row));
    } catch (error) {
      console.error('Error loading world state:', error);
      return [];
    }
  }

  async deleteZone(zoneId: string): Promise<WorldPersistenceResult> {
    try {
      const query = 'DELETE FROM world_entities WHERE zone_id = $1';
      const result = await this.db.query(query, [zoneId]);
      
      return { success: true, zoneId };
    } catch (error) {
      return { success: false, reason: 'Failed to delete zone: ' + error };
    }
  }

  async listZones(): Promise<string[]> {
    try {
      const query = 'SELECT DISTINCT zone_id FROM world_entities ORDER BY zone_id';
      const result = await this.db.query(query);
      
      return result.rows.map((row: any) => row.zone_id);
    } catch (error) {
      console.error('Error listing zones:', error);
      return [];
    }
  }

  async getEntitiesByType(zoneId: string, type: EntityType): Promise<Entity[]> {
    try {
      const query = 'SELECT * FROM world_entities WHERE zone_id = $1 AND type = $2 ORDER BY name';
      const result = await this.db.query(query, [zoneId, type]);
      
      return result.rows.map((row: any) => this.rowToEntity(row));
    } catch (error) {
      console.error('Error getting entities by type:', error);
      return [];
    }
  }

  async getEntitiesByName(zoneId: string, name: string): Promise<Entity[]> {
    try {
      const query = 'SELECT * FROM world_entities WHERE zone_id = $1 AND name = $2 ORDER BY id';
      const result = await this.db.query(query, [zoneId, name]);
      
      return result.rows.map((row: any) => this.rowToEntity(row));
    } catch (error) {
      console.error('Error getting entities by name:', error);
      return [];
    }
  }

  async createBackup(): Promise<WorldBackupResult> {
    try {
      const backupId = this.generateBackupId();
      
      // Get all zones and their entities
      const zones = await this.listZones();
      const zoneData: Record<string, Entity[]> = {};
      
      for (const zoneId of zones) {
        zoneData[zoneId] = await this.loadWorldState(zoneId);
      }
      
      // Store backup
      const query = 'INSERT INTO world_backups (backup_id, zone_data) VALUES ($1, $2)';
      await this.db.query(query, [backupId, JSON.stringify(zoneData)]);
      
      return { 
        success: true, 
        backupId, 
        zoneCount: zones.length 
      };
    } catch (error) {
      return { success: false, reason: 'Failed to create backup: ' + error };
    }
  }

  async restoreFromBackup(backupId: string): Promise<WorldRestoreResult> {
    try {
      // Get backup data
      const query = 'SELECT zone_data FROM world_backups WHERE backup_id = $1';
      const result = await this.db.query(query, [backupId]);
      
      if (result.rows.length === 0) {
        return { success: false, reason: 'Backup not found' };
      }

      const zoneData: Record<string, Entity[]> = result.rows[0].zone_data;
      
      // Clear existing data
      await this.db.query('DELETE FROM world_entities');
      
      // Restore zones
      for (const [zoneId, entities] of Object.entries(zoneData)) {
        await this.saveWorldState(zoneId, entities);
      }

      return { success: true };
    } catch (error) {
      return { success: false, reason: 'Failed to restore backup: ' + error };
    }
  }

  private rowToEntity(row: any): Entity {
    return {
      id: row.id,
      name: row.name,
      type: row.type as EntityType,
      pos: { x: row.pos_x, y: row.pos_y, z: row.pos_z },
      vel: { vx: row.vel_vx, vz: row.vel_vz },
      dir: row.dir,
      anim: row.anim,
      level: row.level,
      hp: row.hp,
      maxHp: row.max_hp,
      spawnPos: { x: row.spawn_pos_x, y: row.spawn_pos_y, z: row.spawn_pos_z },
      leashDistance: row.leash_distance,
      aiState: {
        current: 'idle',
        lastUpdate: Date.now()
      }
    };
  }

  private validateEntity(entity: Entity): { valid: boolean; reason?: string } {
    if (!entity.id || entity.id.trim() === '') {
      return { valid: false, reason: 'Invalid entity data: missing ID' };
    }

    if (!entity.name || entity.name.trim() === '') {
      return { valid: false, reason: 'Invalid entity data: missing name' };
    }

    if (!Object.values(EntityType).includes(entity.type)) {
      return { valid: false, reason: 'Invalid entity data: invalid type' };
    }

    if (entity.level < 1 || entity.level > 100) {
      return { valid: false, reason: 'Invalid entity data: level must be between 1 and 100' };
    }

    if (entity.hp < 0 || entity.hp > entity.maxHp) {
      return { valid: false, reason: 'Invalid entity data: HP must be between 0 and maxHp' };
    }

    if (!entity.pos || typeof entity.pos.x !== 'number' || typeof entity.pos.y !== 'number' || typeof entity.pos.z !== 'number') {
      return { valid: false, reason: 'Invalid entity data: invalid position' };
    }

    if (!entity.spawnPos || typeof entity.spawnPos.x !== 'number' || typeof entity.spawnPos.y !== 'number' || typeof entity.spawnPos.z !== 'number') {
      return { valid: false, reason: 'Invalid entity data: invalid spawn position' };
    }

    return { valid: true };
  }

  private generateBackupId(): string {
    return 'world-backup-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
}
