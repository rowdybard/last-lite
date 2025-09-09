import { describe, it, expect, beforeEach } from 'vitest';
import { DungeonSystem } from '../src/systems/dungeon';
import { Player, EntityType } from '../shared/types';

describe('DungeonSystem', () => {
  let dungeonSystem: DungeonSystem;
  let mockPlayer1: Player;
  let mockPlayer2: Player;

  beforeEach(() => {
    dungeonSystem = new DungeonSystem();
    
    mockPlayer1 = {
      id: 'player-1',
      name: 'TestPlayer1',
      class: 'warrior' as any,
      level: 5,
      xp: 0,
      pos: { x: 0, y: 0, z: 0 },
      vel: { vx: 0, vz: 0 },
      dir: 0,
      anim: 'idle',
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      gold: 0,
      buffs: [],
      debuffs: [],
      lastGcd: 0,
      abilityCooldowns: new Map(),
      inventory: [],
      lastActivity: Date.now()
    };

    mockPlayer2 = {
      id: 'player-2',
      name: 'TestPlayer2',
      class: 'mage' as any,
      level: 5,
      xp: 0,
      pos: { x: 0, y: 0, z: 0 },
      vel: { vx: 0, vz: 0 },
      dir: 0,
      anim: 'idle',
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      gold: 0,
      buffs: [],
      debuffs: [],
      lastGcd: 0,
      abilityCooldowns: new Map(),
      inventory: [],
      lastActivity: Date.now()
    };
  });

  describe('dungeon creation', () => {
    it('should create a new dungeon instance', () => {
      const dungeon = dungeonSystem.createDungeon('test-dungeon', [mockPlayer1, mockPlayer2]);
      
      expect(dungeon).toBeDefined();
      expect(dungeon.id).toBeDefined();
      expect(dungeon.type).toBe('test-dungeon');
      expect(dungeon.players).toContain(mockPlayer1.id);
      expect(dungeon.players).toContain(mockPlayer2.id);
      expect(dungeon.status).toBe('active');
    });

    it('should validate minimum party size for dungeon', () => {
      const result = dungeonSystem.canCreateDungeon('test-dungeon', [mockPlayer1]);
      
      expect(result.canCreate).toBe(false);
      expect(result.reason).toBe('Minimum party size is 2 players');
    });

    it('should validate player level requirements', () => {
      const lowLevelPlayer = { ...mockPlayer1, level: 1 };
      const result = dungeonSystem.canCreateDungeon('test-dungeon', [mockPlayer1, lowLevelPlayer]);
      
      expect(result.canCreate).toBe(false);
      expect(result.reason).toBe('Player level too low for this dungeon');
    });
  });

  describe('dungeon management', () => {
    it('should add players to existing dungeon', () => {
      const dungeon = dungeonSystem.createDungeon('test-dungeon', [mockPlayer1, mockPlayer2]);
      const newPlayer = { ...mockPlayer1, id: 'player-3' };
      
      const result = dungeonSystem.addPlayerToDungeon(dungeon.id, newPlayer);
      
      expect(result.success).toBe(true);
      expect(dungeon.players).toContain('player-3');
    });

    it('should remove players from dungeon', () => {
      const dungeon = dungeonSystem.createDungeon('test-dungeon', [mockPlayer1, mockPlayer2]);
      
      const result = dungeonSystem.removePlayerFromDungeon(dungeon.id, mockPlayer1.id);
      
      expect(result.success).toBe(true);
      expect(dungeon.players).not.toContain(mockPlayer1.id);
    });

    it('should complete dungeon when objectives are met', () => {
      const dungeon = dungeonSystem.createDungeon('test-dungeon', [mockPlayer1, mockPlayer2]);
      
      dungeonSystem.completeDungeon(dungeon.id);
      
      expect(dungeon.status).toBe('completed');
      expect(dungeon.completedAt).toBeDefined();
    });

    it('should handle dungeon failure', () => {
      const dungeon = dungeonSystem.createDungeon('test-dungeon', [mockPlayer1, mockPlayer2]);
      
      dungeonSystem.failDungeon(dungeon.id, 'All players died');
      
      expect(dungeon.status).toBe('failed');
      expect(dungeon.failureReason).toBe('All players died');
    });
  });

  describe('dungeon instances', () => {
    it('should create multiple instances of same dungeon type', () => {
      const dungeon1 = dungeonSystem.createDungeon('test-dungeon', [mockPlayer1, mockPlayer2]);
      const dungeon2 = dungeonSystem.createDungeon('test-dungeon', [mockPlayer1, mockPlayer2]);
      
      expect(dungeon1.id).not.toBe(dungeon2.id);
      expect(dungeon1.type).toBe(dungeon2.type);
    });

    it('should get dungeon by ID', () => {
      const dungeon = dungeonSystem.createDungeon('test-dungeon', [mockPlayer1, mockPlayer2]);
      
      const foundDungeon = dungeonSystem.getDungeon(dungeon.id);
      
      expect(foundDungeon).toBe(dungeon);
    });

    it('should list all active dungeons', () => {
      const dungeon1 = dungeonSystem.createDungeon('test-dungeon', [mockPlayer1, mockPlayer2]);
      const dungeon2 = dungeonSystem.createDungeon('test-dungeon', [mockPlayer1, mockPlayer2]);
      
      const activeDungeons = dungeonSystem.getActiveDungeons();
      
      expect(activeDungeons).toHaveLength(2);
      expect(activeDungeons).toContain(dungeon1);
      expect(activeDungeons).toContain(dungeon2);
    });
  });

  describe('dungeon cleanup', () => {
    it('should clean up completed dungeons after timeout', () => {
      const dungeon = dungeonSystem.createDungeon('test-dungeon', [mockPlayer1, mockPlayer2]);
      dungeonSystem.completeDungeon(dungeon.id);
      
      // Simulate time passing
      dungeon.completedAt = Date.now() - (31 * 60 * 1000); // 31 minutes ago
      
      dungeonSystem.cleanupExpiredDungeons();
      
      const foundDungeon = dungeonSystem.getDungeon(dungeon.id);
      expect(foundDungeon).toBeUndefined();
    });

    it('should not clean up active dungeons', () => {
      const dungeon = dungeonSystem.createDungeon('test-dungeon', [mockPlayer1, mockPlayer2]);
      
      dungeonSystem.cleanupExpiredDungeons();
      
      const foundDungeon = dungeonSystem.getDungeon(dungeon.id);
      expect(foundDungeon).toBe(dungeon);
    });
  });
});
