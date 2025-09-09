import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LootSystem } from '../src/systems/loot';
import { Entity, Player, CharacterClass, Rarity, ItemType } from '../shared/types';

describe('LootSystem', () => {
  let lootSystem: LootSystem;
  let mockPlayer: Player;
  let mockEntity: Entity;

  beforeEach(() => {
    lootSystem = new LootSystem();
    
    mockPlayer = {
      id: 'player-1',
      name: 'TestPlayer',
      class: CharacterClass.Warrior,
      level: 1,
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
      lastGcd: 0,
      abilityCooldowns: new Map(),
    };

    mockEntity = {
      id: 'boarling-1',
      name: 'Boarling',
      type: 'mob' as any,
      pos: { x: 1, y: 0, z: 0 },
      vel: { vx: 0, vz: 0 },
      dir: 0,
      anim: 'idle',
      hp: 0, // Dead
      maxHp: 60,
      level: 2,
      aiState: 'idle' as any,
      spawnPos: { x: 0, y: 0, z: 0 },
      leashDistance: 8,
    };
  });

  it('should generate loot drops when entity dies', () => {
    const drops = lootSystem.generateLoot(mockEntity, mockPlayer);
    
    expect(drops).toBeDefined();
    expect(Array.isArray(drops)).toBe(true);
    expect(drops.length).toBeGreaterThan(0);
  });

  it('should generate gold drops based on entity level', () => {
    const drops = lootSystem.generateLoot(mockEntity, mockPlayer);
    
    const goldDrop = drops.find(drop => drop.itemId === 'gold');
    expect(goldDrop).toBeDefined();
    expect(goldDrop?.quantity).toBeGreaterThan(0);
    expect(goldDrop?.quantity).toBeLessThanOrEqual(mockEntity.level * 15); // Max gold per level (with multiplier)
  });

  it('should generate items with appropriate rarity', () => {
    const drops = lootSystem.generateLoot(mockEntity, mockPlayer);
    
    const itemDrops = drops.filter(drop => drop.itemId !== 'gold');
    if (itemDrops.length > 0) {
      const drop = itemDrops[0];
      expect(drop.rarity).toBeDefined();
      expect(Object.values(Rarity)).toContain(drop.rarity);
    }
  });

  it('should respect drop rates for different item types', () => {
    const totalDrops = 1000;
    let commonDrops = 0;
    let rareDrops = 0;

    for (let i = 0; i < totalDrops; i++) {
      const drops = lootSystem.generateLoot(mockEntity, mockPlayer);
      const itemDrops = drops.filter(drop => drop.itemId !== 'gold');
      
      itemDrops.forEach(drop => {
        if (drop.rarity === Rarity.Common) commonDrops++;
        if (drop.rarity === Rarity.Rare) rareDrops++;
      });
    }

    // Common items should drop more frequently than rare items
    expect(commonDrops).toBeGreaterThan(rareDrops);
  });

  it('should generate level-appropriate items', () => {
    const highLevelEntity = { ...mockEntity, level: 10 };
    const drops = lootSystem.generateLoot(highLevelEntity, mockPlayer);
    
    const itemDrops = drops.filter(drop => drop.itemId !== 'gold');
    if (itemDrops.length > 0) {
      const drop = itemDrops[0];
      expect(drop.level).toBeGreaterThanOrEqual(1);
      expect(drop.level).toBeLessThanOrEqual(highLevelEntity.level + 2);
    }
  });

  it('should create drop entities with correct properties', () => {
    const drops = lootSystem.generateLoot(mockEntity, mockPlayer);
    
    if (drops.length > 0) {
      const drop = drops[0];
      expect(drop.id).toBeDefined();
      expect(drop.itemId).toBeDefined();
      expect(drop.pos).toEqual(mockEntity.pos);
      expect(drop.createdAt).toBeGreaterThan(0);
      expect(drop.ttl).toBeGreaterThan(0);
    }
  });

  it('should handle personal loot correctly', () => {
    const drops = lootSystem.generateLoot(mockEntity, mockPlayer);
    
    drops.forEach(drop => {
      expect(drop.ownerId).toBe(mockPlayer.id);
    });
  });

  it('should generate different loot for different entity types', () => {
    const goblinEntity = { ...mockEntity, name: 'Goblin', level: 1 };
    const orcEntity = { ...mockEntity, name: 'Orc', level: 5 };
    
    const goblinDrops = lootSystem.generateLoot(goblinEntity, mockPlayer);
    const orcDrops = lootSystem.generateLoot(orcEntity, mockPlayer);
    
    // Higher level entities should potentially drop better loot
    const goblinGold = goblinDrops.find(d => d.itemId === 'gold')?.quantity || 0;
    const orcGold = orcDrops.find(d => d.itemId === 'gold')?.quantity || 0;
    
    expect(orcGold).toBeGreaterThanOrEqual(goblinGold);
  });

  it('should respect player level for loot generation', () => {
    const highLevelPlayer = { ...mockPlayer, level: 10 };
    const drops = lootSystem.generateLoot(mockEntity, highLevelPlayer);
    
    // Higher level players might get better loot or more gold
    const goldDrop = drops.find(drop => drop.itemId === 'gold');
    expect(goldDrop?.quantity).toBeGreaterThan(0);
  });

  it('should clean up expired drops', () => {
    const drops = lootSystem.generateLoot(mockEntity, mockPlayer);
    
    if (drops.length > 0) {
      const drop = drops[0];
      const expiredDrop = { ...drop, createdAt: Date.now() - (drop.ttl + 1000) };
      
      const isExpired = lootSystem.isDropExpired(expiredDrop);
      expect(isExpired).toBe(true);
    }
  });
});
