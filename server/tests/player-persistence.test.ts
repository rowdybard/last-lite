import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PlayerPersistence } from '../src/systems/player-persistence';
import { Player } from '../shared/types';

describe('PlayerPersistence', () => {
  let playerPersistence: PlayerPersistence;
  let mockPlayer: Player;

  beforeEach(() => {
    playerPersistence = new PlayerPersistence();
    
    mockPlayer = {
      id: 'player-1',
      name: 'TestPlayer',
      class: 'warrior' as any,
      level: 5,
      xp: 1250,
      pos: { x: 10, y: 0, z: 15 },
      vel: { vx: 0, vz: 0 },
      dir: 45,
      anim: 'idle',
      hp: 85,
      maxHp: 100,
      mp: 40,
      maxMp: 50,
      gold: 500,
      buffs: [
        { id: 'strength', duration: 300, stacks: 1 }
      ],
      debuffs: [
        { id: 'poison', duration: 60, stacks: 2 }
      ],
      lastGcd: Date.now() - 1000,
      abilityCooldowns: new Map([
        ['Slash', Date.now() + 5000],
        ['Whirlwind', Date.now() + 10000]
      ]),
      inventory: [
        {
          id: 'iron-sword',
          name: 'Iron Sword',
          type: 'weapon' as any,
          rarity: 'common' as any,
          level: 5,
          quantity: 1,
          value: 100
        },
        {
          id: 'health-potion',
          name: 'Health Potion',
          type: 'consumable' as any,
          rarity: 'common' as any,
          level: 1,
          quantity: 3,
          value: 25
        }
      ],
      lastActivity: Date.now()
    };
  });

  afterEach(() => {
    // Clean up any test data
    playerPersistence.clearAllData();
  });

  describe('player saving', () => {
    it('should save player data to storage', async () => {
      const result = await playerPersistence.savePlayer(mockPlayer);
      
      expect(result.success).toBe(true);
      expect(result.playerId).toBe(mockPlayer.id);
    });

    it('should save player with all properties', async () => {
      await playerPersistence.savePlayer(mockPlayer);
      
      const savedPlayer = await playerPersistence.loadPlayer(mockPlayer.id);
      
      expect(savedPlayer).toBeDefined();
      expect(savedPlayer?.id).toBe(mockPlayer.id);
      expect(savedPlayer?.name).toBe(mockPlayer.name);
      expect(savedPlayer?.level).toBe(mockPlayer.level);
      expect(savedPlayer?.xp).toBe(mockPlayer.xp);
      expect(savedPlayer?.pos).toEqual(mockPlayer.pos);
      expect(savedPlayer?.hp).toBe(mockPlayer.hp);
      expect(savedPlayer?.mp).toBe(mockPlayer.mp);
      expect(savedPlayer?.gold).toBe(mockPlayer.gold);
      expect(savedPlayer?.buffs).toEqual(mockPlayer.buffs);
      expect(savedPlayer?.debuffs).toEqual(mockPlayer.debuffs);
      expect(savedPlayer?.inventory).toEqual(mockPlayer.inventory);
    });

    it('should handle ability cooldowns serialization', async () => {
      await playerPersistence.savePlayer(mockPlayer);
      
      const savedPlayer = await playerPersistence.loadPlayer(mockPlayer.id);
      
      expect(savedPlayer?.abilityCooldowns).toBeDefined();
      expect(savedPlayer?.abilityCooldowns.size).toBe(2);
      expect(savedPlayer?.abilityCooldowns.has('Slash')).toBe(true);
      expect(savedPlayer?.abilityCooldowns.has('Whirlwind')).toBe(true);
    });

    it('should update existing player data', async () => {
      // Save initial player
      await playerPersistence.savePlayer(mockPlayer);
      
      // Modify player
      const updatedPlayer = {
        ...mockPlayer,
        level: 6,
        xp: 2000,
        gold: 750,
        hp: 100
      };
      
      // Save updated player
      const result = await playerPersistence.savePlayer(updatedPlayer);
      
      expect(result.success).toBe(true);
      
      // Verify update
      const savedPlayer = await playerPersistence.loadPlayer(mockPlayer.id);
      expect(savedPlayer?.level).toBe(6);
      expect(savedPlayer?.xp).toBe(2000);
      expect(savedPlayer?.gold).toBe(750);
      expect(savedPlayer?.hp).toBe(100);
    });
  });

  describe('player loading', () => {
    it('should load existing player data', async () => {
      await playerPersistence.savePlayer(mockPlayer);
      
      const loadedPlayer = await playerPersistence.loadPlayer(mockPlayer.id);
      
      expect(loadedPlayer).toBeDefined();
      expect(loadedPlayer?.id).toBe(mockPlayer.id);
    });

    it('should return null for non-existent player', async () => {
      const loadedPlayer = await playerPersistence.loadPlayer('non-existent');
      
      expect(loadedPlayer).toBeNull();
    });

    it('should load player with correct data types', async () => {
      await playerPersistence.savePlayer(mockPlayer);
      
      const loadedPlayer = await playerPersistence.loadPlayer(mockPlayer.id);
      
      expect(loadedPlayer).toBeDefined();
      expect(typeof loadedPlayer?.level).toBe('number');
      expect(typeof loadedPlayer?.xp).toBe('number');
      expect(typeof loadedPlayer?.hp).toBe('number');
      expect(typeof loadedPlayer?.mp).toBe('number');
      expect(typeof loadedPlayer?.gold).toBe('number');
      expect(Array.isArray(loadedPlayer?.buffs)).toBe(true);
      expect(Array.isArray(loadedPlayer?.debuffs)).toBe(true);
      expect(Array.isArray(loadedPlayer?.inventory)).toBe(true);
      expect(loadedPlayer?.abilityCooldowns instanceof Map).toBe(true);
    });
  });

  describe('player deletion', () => {
    it('should delete existing player', async () => {
      await playerPersistence.savePlayer(mockPlayer);
      
      const result = await playerPersistence.deletePlayer(mockPlayer.id);
      
      expect(result.success).toBe(true);
      
      const loadedPlayer = await playerPersistence.loadPlayer(mockPlayer.id);
      expect(loadedPlayer).toBeNull();
    });

    it('should handle deletion of non-existent player', async () => {
      const result = await playerPersistence.deletePlayer('non-existent');
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Player not found');
    });
  });

  describe('player queries', () => {
    it('should list all saved players', async () => {
      const player2 = { ...mockPlayer, id: 'player-2', name: 'TestPlayer2' };
      const player3 = { ...mockPlayer, id: 'player-3', name: 'TestPlayer3' };
      
      await playerPersistence.savePlayer(mockPlayer);
      await playerPersistence.savePlayer(player2);
      await playerPersistence.savePlayer(player3);
      
      const players = await playerPersistence.listPlayers();
      
      expect(players).toHaveLength(3);
      expect(players.map(p => p.id)).toContain('player-1');
      expect(players.map(p => p.id)).toContain('player-2');
      expect(players.map(p => p.id)).toContain('player-3');
    });

    it('should find player by name', async () => {
      await playerPersistence.savePlayer(mockPlayer);
      
      const foundPlayer = await playerPersistence.findPlayerByName(mockPlayer.name);
      
      expect(foundPlayer).toBeDefined();
      expect(foundPlayer?.id).toBe(mockPlayer.id);
      expect(foundPlayer?.name).toBe(mockPlayer.name);
    });

    it('should return null when player name not found', async () => {
      const foundPlayer = await playerPersistence.findPlayerByName('NonExistent');
      
      expect(foundPlayer).toBeNull();
    });
  });

  describe('data validation', () => {
    it('should validate player data before saving', async () => {
      const invalidPlayer = { ...mockPlayer, id: '' };
      
      const result = await playerPersistence.savePlayer(invalidPlayer);
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Invalid player data: missing ID');
    });

    it('should validate required player fields', async () => {
      const invalidPlayer = { ...mockPlayer, name: '' };
      
      const result = await playerPersistence.savePlayer(invalidPlayer);
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Invalid player data: missing name');
    });

    it('should validate player level bounds', async () => {
      const invalidPlayer = { ...mockPlayer, level: -1 };
      
      const result = await playerPersistence.savePlayer(invalidPlayer);
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Invalid player data: level must be between 1 and 100');
    });
  });

  describe('backup and restore', () => {
    it('should create backup of player data', async () => {
      await playerPersistence.savePlayer(mockPlayer);
      
      const backup = await playerPersistence.createBackup();
      
      expect(backup.success).toBe(true);
      expect(backup.backupId).toBeDefined();
      expect(backup.playerCount).toBe(1);
    });

    it('should restore from backup', async () => {
      await playerPersistence.savePlayer(mockPlayer);
      const backup = await playerPersistence.createBackup();
      
      // Clear data
      playerPersistence.clearAllData();
      
      // Restore from backup
      const result = await playerPersistence.restoreFromBackup(backup.backupId!);
      
      expect(result.success).toBe(true);
      
      const restoredPlayer = await playerPersistence.loadPlayer(mockPlayer.id);
      expect(restoredPlayer).toBeDefined();
      expect(restoredPlayer?.name).toBe(mockPlayer.name);
    });
  });
});
