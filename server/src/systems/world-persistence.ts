import { Entity, EntityType, EntityTypeEnum } from '../shared/types.js';

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

export class WorldPersistence {
  private zoneStorage: Map<string, Entity[]> = new Map();
  private backups: Map<string, Map<string, Entity[]>> = new Map();

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

      // Save world state
      this.zoneStorage.set(zoneId, entities.map(entity => ({ ...entity })));
      
      return { success: true, zoneId, entityCount: entities.length };
    } catch (error) {
      return { success: false, reason: 'Failed to save world state: ' + error };
    }
  }

  async loadWorldState(zoneId: string): Promise<Entity[]> {
    try {
      const entities = this.zoneStorage.get(zoneId);
      return entities ? entities.map(entity => ({ ...entity })) : [];
    } catch (error) {
      return [];
    }
  }

  async deleteZone(zoneId: string): Promise<WorldPersistenceResult> {
    try {
      if (!this.zoneStorage.has(zoneId)) {
        return { success: false, reason: 'Zone not found' };
      }

      this.zoneStorage.delete(zoneId);
      return { success: true, zoneId };
    } catch (error) {
      return { success: false, reason: 'Failed to delete zone: ' + error };
    }
  }

  async listZones(): Promise<string[]> {
    try {
      return Array.from(this.zoneStorage.keys());
    } catch (error) {
      return [];
    }
  }

  async getEntitiesByType(zoneId: string, type: EntityType): Promise<Entity[]> {
    try {
      const entities = this.zoneStorage.get(zoneId) || [];
      return entities.filter(entity => entity.type === type).map(entity => ({ ...entity }));
    } catch (error) {
      return [];
    }
  }

  async getEntitiesByName(zoneId: string, name: string): Promise<Entity[]> {
    try {
      const entities = this.zoneStorage.get(zoneId) || [];
      return entities.filter(entity => entity.name === name).map(entity => ({ ...entity }));
    } catch (error) {
      return [];
    }
  }

  async createBackup(): Promise<WorldBackupResult> {
    try {
      const backupId = this.generateBackupId();
      const backup = new Map(this.zoneStorage);
      this.backups.set(backupId, backup);
      
      return { 
        success: true, 
        backupId, 
        zoneCount: this.zoneStorage.size 
      };
    } catch (error) {
      return { success: false, reason: 'Failed to create backup: ' + error };
    }
  }

  async restoreFromBackup(backupId: string): Promise<WorldRestoreResult> {
    try {
      const backup = this.backups.get(backupId);
      if (!backup) {
        return { success: false, reason: 'Backup not found' };
      }

      this.zoneStorage.clear();
      for (const [zoneId, entities] of backup) {
        this.zoneStorage.set(zoneId, entities.map(entity => ({ ...entity })));
      }

      return { success: true };
    } catch (error) {
      return { success: false, reason: 'Failed to restore backup: ' + error };
    }
  }

  clearAllData(): void {
    this.zoneStorage.clear();
    // Don't clear backups - they should persist for restore operations
  }

  private validateEntity(entity: Entity): { valid: boolean; reason?: string } {
    if (!entity.id || entity.id.trim() === '') {
      return { valid: false, reason: 'Invalid entity data: missing ID' };
    }

    if (!entity.name || entity.name.trim() === '') {
      return { valid: false, reason: 'Invalid entity data: missing name' };
    }

    if (!Object.values(EntityTypeEnum).includes(entity.type)) {
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
