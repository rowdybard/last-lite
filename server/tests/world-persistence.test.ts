import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldPersistence } from '../src/systems/world-persistence';
import { Entity, EntityType } from '../shared/types';

describe('WorldPersistence', () => {
  let worldPersistence: WorldPersistence;
  let mockEntities: Entity[];

  beforeEach(() => {
    worldPersistence = new WorldPersistence();
    
    mockEntities = [
      {
        id: 'entity-1',
        name: 'Boarling',
        type: EntityType.Mob,
        pos: { x: 10, y: 0, z: 15 },
        vel: { vx: 0, vz: 0 },
        dir: 0,
        anim: 'idle',
        level: 3,
        hp: 60,
        maxHp: 60,
        spawnPos: { x: 10, y: 0, z: 15 },
        leashDistance: 8
      },
      {
        id: 'entity-2',
        name: 'Goblin',
        type: EntityType.Mob,
        pos: { x: 25, y: 0, z: 30 },
        vel: { vx: 0, vz: 0 },
        dir: 45,
        anim: 'walk',
        level: 4,
        hp: 45,
        maxHp: 80,
        spawnPos: { x: 25, y: 0, z: 30 },
        leashDistance: 10
      },
      {
        id: 'entity-3',
        name: 'Health Potion',
        type: EntityType.Item,
        pos: { x: 5, y: 0, z: 5 },
        vel: { vx: 0, vz: 0 },
        dir: 0,
        anim: 'idle',
        level: 1,
        hp: 0,
        maxHp: 0,
        spawnPos: { x: 5, y: 0, z: 5 },
        leashDistance: 0
      }
    ];
  });

  afterEach(() => {
    worldPersistence.clearAllData();
  });

  describe('world state saving', () => {
    it('should save world state for a zone', async () => {
      const zoneId = 'field-zone';
      
      const result = await worldPersistence.saveWorldState(zoneId, mockEntities);
      
      expect(result.success).toBe(true);
      expect(result.zoneId).toBe(zoneId);
      expect(result.entityCount).toBe(mockEntities.length);
    });

    it('should save entities with all properties', async () => {
      const zoneId = 'field-zone';
      await worldPersistence.saveWorldState(zoneId, mockEntities);
      
      const loadedEntities = await worldPersistence.loadWorldState(zoneId);
      
      expect(loadedEntities).toHaveLength(3);
      
      const boarling = loadedEntities.find(e => e.id === 'entity-1');
      expect(boarling).toBeDefined();
      expect(boarling?.name).toBe('Boarling');
      expect(boarling?.type).toBe(EntityType.Mob);
      expect(boarling?.pos).toEqual({ x: 10, y: 0, z: 15 });
      expect(boarling?.level).toBe(3);
      expect(boarling?.hp).toBe(60);
      expect(boarling?.spawnPos).toEqual({ x: 10, y: 0, z: 15 });
    });

    it('should update existing world state', async () => {
      const zoneId = 'field-zone';
      
      // Save initial state
      await worldPersistence.saveWorldState(zoneId, mockEntities);
      
      // Modify entities
      const updatedEntities = mockEntities.map(entity => ({
        ...entity,
        hp: entity.maxHp, // Reset HP to full
        pos: entity.spawnPos // Reset position
      }));
      
      // Save updated state
      const result = await worldPersistence.saveWorldState(zoneId, updatedEntities);
      
      expect(result.success).toBe(true);
      
      // Verify update
      const loadedEntities = await worldPersistence.loadWorldState(zoneId);
      const boarling = loadedEntities.find(e => e.id === 'entity-1');
      expect(boarling?.hp).toBe(boarling?.maxHp);
    });
  });

  describe('world state loading', () => {
    it('should load existing world state', async () => {
      const zoneId = 'field-zone';
      await worldPersistence.saveWorldState(zoneId, mockEntities);
      
      const loadedEntities = await worldPersistence.loadWorldState(zoneId);
      
      expect(loadedEntities).toHaveLength(3);
      expect(loadedEntities.map(e => e.id)).toContain('entity-1');
      expect(loadedEntities.map(e => e.id)).toContain('entity-2');
      expect(loadedEntities.map(e => e.id)).toContain('entity-3');
    });

    it('should return empty array for non-existent zone', async () => {
      const loadedEntities = await worldPersistence.loadWorldState('non-existent');
      
      expect(loadedEntities).toEqual([]);
    });

    it('should load entities with correct data types', async () => {
      const zoneId = 'field-zone';
      await worldPersistence.saveWorldState(zoneId, mockEntities);
      
      const loadedEntities = await worldPersistence.loadWorldState(zoneId);
      
      expect(loadedEntities).toHaveLength(3);
      
      const entity = loadedEntities[0];
      expect(typeof entity.level).toBe('number');
      expect(typeof entity.hp).toBe('number');
      expect(typeof entity.maxHp).toBe('number');
      expect(typeof entity.pos.x).toBe('number');
      expect(typeof entity.pos.y).toBe('number');
      expect(typeof entity.pos.z).toBe('number');
      expect(typeof entity.spawnPos.x).toBe('number');
      expect(typeof entity.spawnPos.y).toBe('number');
      expect(typeof entity.spawnPos.z).toBe('number');
    });
  });

  describe('zone management', () => {
    it('should list all saved zones', async () => {
      await worldPersistence.saveWorldState('field-zone', mockEntities);
      await worldPersistence.saveWorldState('hub-zone', []);
      await worldPersistence.saveWorldState('dungeon-1', mockEntities.slice(0, 1));
      
      const zones = await worldPersistence.listZones();
      
      expect(zones).toHaveLength(3);
      expect(zones).toContain('field-zone');
      expect(zones).toContain('hub-zone');
      expect(zones).toContain('dungeon-1');
    });

    it('should delete zone data', async () => {
      const zoneId = 'field-zone';
      await worldPersistence.saveWorldState(zoneId, mockEntities);
      
      const result = await worldPersistence.deleteZone(zoneId);
      
      expect(result.success).toBe(true);
      
      const loadedEntities = await worldPersistence.loadWorldState(zoneId);
      expect(loadedEntities).toEqual([]);
    });

    it('should handle deletion of non-existent zone', async () => {
      const result = await worldPersistence.deleteZone('non-existent');
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Zone not found');
    });
  });

  describe('entity filtering', () => {
    it('should filter entities by type', async () => {
      const zoneId = 'field-zone';
      await worldPersistence.saveWorldState(zoneId, mockEntities);
      
      const mobs = await worldPersistence.getEntitiesByType(zoneId, EntityType.Mob);
      const items = await worldPersistence.getEntitiesByType(zoneId, EntityType.Item);
      
      expect(mobs).toHaveLength(2);
      expect(items).toHaveLength(1);
      expect(mobs.every(e => e.type === EntityType.Mob)).toBe(true);
      expect(items.every(e => e.type === EntityType.Item)).toBe(true);
    });

    it('should get entities by name', async () => {
      const zoneId = 'field-zone';
      await worldPersistence.saveWorldState(zoneId, mockEntities);
      
      const boarlings = await worldPersistence.getEntitiesByName(zoneId, 'Boarling');
      const goblins = await worldPersistence.getEntitiesByName(zoneId, 'Goblin');
      
      expect(boarlings).toHaveLength(1);
      expect(goblins).toHaveLength(1);
      expect(boarlings[0].name).toBe('Boarling');
      expect(goblins[0].name).toBe('Goblin');
    });
  });

  describe('data validation', () => {
    it('should validate entity data before saving', async () => {
      const invalidEntities = [
        { ...mockEntities[0], id: '' } // Missing ID
      ];
      
      const result = await worldPersistence.saveWorldState('field-zone', invalidEntities);
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Invalid entity data: missing ID');
    });

    it('should validate zone ID', async () => {
      const result = await worldPersistence.saveWorldState('', mockEntities);
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Invalid zone ID');
    });
  });

  describe('backup and restore', () => {
    it('should create backup of world data', async () => {
      await worldPersistence.saveWorldState('field-zone', mockEntities);
      await worldPersistence.saveWorldState('hub-zone', []);
      
      const backup = await worldPersistence.createBackup();
      
      expect(backup.success).toBe(true);
      expect(backup.backupId).toBeDefined();
      expect(backup.zoneCount).toBe(2);
    });

    it('should restore from backup', async () => {
      await worldPersistence.saveWorldState('field-zone', mockEntities);
      const backup = await worldPersistence.createBackup();
      
      // Clear data
      worldPersistence.clearAllData();
      
      // Restore from backup
      const result = await worldPersistence.restoreFromBackup(backup.backupId!);
      
      expect(result.success).toBe(true);
      
      const restoredEntities = await worldPersistence.loadWorldState('field-zone');
      expect(restoredEntities).toHaveLength(3);
      expect(restoredEntities[0].name).toBe('Boarling');
    });
  });

  describe('performance', () => {
    it('should handle large numbers of entities', async () => {
      const largeEntityList: Entity[] = [];
      for (let i = 0; i < 1000; i++) {
        largeEntityList.push({
          id: `entity-${i}`,
          name: `TestEntity${i}`,
          type: EntityType.Mob,
          pos: { x: i, y: 0, z: i },
          vel: { vx: 0, vz: 0 },
          dir: 0,
          anim: 'idle',
          level: 1,
          hp: 100,
          maxHp: 100,
          spawnPos: { x: i, y: 0, z: i },
          leashDistance: 5
        });
      }
      
      const result = await worldPersistence.saveWorldState('large-zone', largeEntityList);
      
      expect(result.success).toBe(true);
      expect(result.entityCount).toBe(1000);
      
      const loadedEntities = await worldPersistence.loadWorldState('large-zone');
      expect(loadedEntities).toHaveLength(1000);
    });
  });
});
