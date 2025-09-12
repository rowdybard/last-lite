import { Player } from '../shared/types.js';

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

export class PlayerPersistence {
  private storage: Map<string, Player> = new Map();
  private backups: Map<string, Map<string, Player>> = new Map();

  async savePlayer(player: Player): Promise<PersistenceResult> {
    try {
      // Validate player data
      const validation = this.validatePlayer(player);
      if (!validation.valid) {
        return { success: false, reason: validation.reason };
      }

      // Save player data
      this.storage.set(player.id, { ...player });
      
      return { success: true, playerId: player.id };
    } catch (error) {
      return { success: false, reason: 'Failed to save player: ' + error };
    }
  }

  async loadPlayer(playerId: string): Promise<Player | null> {
    try {
      const player = this.storage.get(playerId);
      return player ? { ...player } : null;
    } catch (error) {
      return null;
    }
  }

  async deletePlayer(playerId: string): Promise<PersistenceResult> {
    try {
      if (!this.storage.has(playerId)) {
        return { success: false, reason: 'Player not found' };
      }

      this.storage.delete(playerId);
      return { success: true, playerId };
    } catch (error) {
      return { success: false, reason: 'Failed to delete player: ' + error };
    }
  }

  async listPlayers(): Promise<Player[]> {
    try {
      return Array.from(this.storage.values()).map(player => ({ ...player }));
    } catch (error) {
      return [];
    }
  }

  async findPlayerByName(name: string): Promise<Player | null> {
    try {
      for (const player of this.storage.values()) {
        if (player.name === name) {
          return { ...player };
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async createBackup(): Promise<BackupResult> {
    try {
      const backupId = this.generateBackupId();
      const backup = new Map(this.storage);
      this.backups.set(backupId, backup);
      
      return { 
        success: true, 
        backupId, 
        playerCount: this.storage.size 
      };
    } catch (error) {
      return { success: false, reason: 'Failed to create backup: ' + error };
    }
  }

  async restoreFromBackup(backupId: string): Promise<RestoreResult> {
    try {
      const backup = this.backups.get(backupId);
      if (!backup) {
        return { success: false, reason: 'Backup not found' };
      }

      this.storage.clear();
      for (const [id, player] of backup) {
        this.storage.set(id, { ...player });
      }

      return { success: true };
    } catch (error) {
      return { success: false, reason: 'Failed to restore backup: ' + error };
    }
  }

  clearAllData(): void {
    this.storage.clear();
    // Don't clear backups - they should persist for restore operations
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
