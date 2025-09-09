import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VendorSystem } from '../src/systems/vendor';
import { Player, CharacterClass, Rarity } from '../shared/types';

describe('VendorSystem', () => {
  let vendorSystem: VendorSystem;
  let mockPlayer: Player;

  beforeEach(() => {
    vendorSystem = new VendorSystem();
    
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
      gold: 1000,
      buffs: [],
      lastGcd: 0,
      abilityCooldowns: new Map(),
    };
  });

  it('should allow player to buy items from vendor', () => {
    const item = {
      id: 'health_potion',
      name: 'Health Potion',
      type: 'consumable',
      rarity: Rarity.Common,
      level: 1,
      quantity: 1,
      value: 50
    };

    const result = vendorSystem.buyItem(mockPlayer, item, 1);
    
    expect(result.success).toBe(true);
    expect(result.cost).toBe(50);
    expect(mockPlayer.gold).toBe(950); // 1000 - 50
  });

  it('should prevent buying items when insufficient gold', () => {
    const expensiveItem = {
      id: 'legendary_sword',
      name: 'Legendary Sword',
      type: 'weapon',
      rarity: Rarity.Epic,
      level: 10,
      quantity: 1,
      value: 2000
    };

    const result = vendorSystem.buyItem(mockPlayer, expensiveItem, 1);
    
    expect(result.success).toBe(false);
    expect(result.reason).toBe('Insufficient gold');
    expect(mockPlayer.gold).toBe(1000); // Unchanged
  });

  it('should prevent buying items when inventory is full', () => {
    // Fill player's inventory
    for (let i = 0; i < 20; i++) {
      const item = {
        id: `item_${i}`,
        name: `Item ${i}`,
        type: 'misc',
        rarity: Rarity.Common,
        level: 1,
        quantity: 1,
        value: 1
      };
      vendorSystem.inventorySystem.addItem(mockPlayer, item);
    }

    const item = {
      id: 'overflow_item',
      name: 'Overflow Item',
      type: 'misc',
      rarity: Rarity.Common,
      level: 1,
      quantity: 1,
      value: 10
    };

    const result = vendorSystem.buyItem(mockPlayer, item, 1);
    
    expect(result.success).toBe(false);
    expect(result.reason).toBe('Inventory full');
  });

  it('should allow player to sell items to vendor', () => {
    const item = {
      id: 'sellable_item',
      name: 'Sellable Item',
      type: 'misc',
      rarity: Rarity.Common,
      level: 1,
      quantity: 1,
      value: 100
    };

    // Add item to player's inventory
    const addResult = vendorSystem.inventorySystem.addItem(mockPlayer, item);
    expect(addResult.success).toBe(true);

    const initialGold = mockPlayer.gold;
    const sellPrice = vendorSystem.calculateSellPrice(item);

    const result = vendorSystem.sellItem(mockPlayer, addResult.slot!, 1);
    
    expect(result.success).toBe(true);
    expect(result.price).toBe(sellPrice);
    expect(mockPlayer.gold).toBe(initialGold + sellPrice);
  });

  it('should prevent selling items that are not in inventory', () => {
    const result = vendorSystem.sellItem(mockPlayer, 0, 1);
    
    expect(result.success).toBe(false);
    expect(result.reason).toBe('No item in slot');
  });

  it('should calculate correct sell prices', () => {
    const commonItem = {
      id: 'common_item',
      name: 'Common Item',
      type: 'misc',
      rarity: Rarity.Common,
      level: 1,
      quantity: 1,
      value: 100
    };

    const rareItem = {
      id: 'rare_item',
      name: 'Rare Item',
      type: 'misc',
      rarity: Rarity.Rare,
      level: 5,
      quantity: 1,
      value: 500
    };

    const commonPrice = vendorSystem.calculateSellPrice(commonItem);
    const rarePrice = vendorSystem.calculateSellPrice(rareItem);

    expect(commonPrice).toBe(25); // 25% of value
    expect(rarePrice).toBe(125); // 25% of value
  });

  it('should get vendor inventory', () => {
    const vendorInventory = vendorSystem.getVendorInventory();
    
    expect(Array.isArray(vendorInventory)).toBe(true);
    expect(vendorInventory.length).toBeGreaterThan(0);
    
    // Check that items have required properties
    vendorInventory.forEach(item => {
      expect(item.id).toBeDefined();
      expect(item.name).toBeDefined();
      expect(item.value).toBeGreaterThan(0);
    });
  });

  it('should filter vendor inventory by player level', () => {
    const lowLevelPlayer = { ...mockPlayer, level: 1 };
    const highLevelPlayer = { ...mockPlayer, level: 10 };

    const lowLevelInventory = vendorSystem.getVendorInventory(lowLevelPlayer);
    const highLevelInventory = vendorSystem.getVendorInventory(highLevelPlayer);

    // High level player should see more items
    expect(highLevelInventory.length).toBeGreaterThanOrEqual(lowLevelInventory.length);
  });

  it('should handle bulk purchases', () => {
    const item = {
      id: 'bulk_item',
      name: 'Bulk Item',
      type: 'consumable',
      rarity: Rarity.Common,
      level: 1,
      quantity: 1,
      value: 10
    };

    const result = vendorSystem.buyItem(mockPlayer, item, 5);
    
    expect(result.success).toBe(true);
    expect(result.cost).toBe(50); // 5 * 10
    expect(mockPlayer.gold).toBe(950); // 1000 - 50
  });

  it('should handle bulk sales', () => {
    const item = {
      id: 'bulk_sell_item',
      name: 'Bulk Sell Item',
      type: 'misc',
      rarity: Rarity.Common,
      level: 1,
      quantity: 10,
      value: 20
    };

    // Add 10 items to inventory
    const addResult = vendorSystem.inventorySystem.addItem(mockPlayer, item);
    expect(addResult.success).toBe(true);

    const initialGold = mockPlayer.gold;
    const result = vendorSystem.sellItem(mockPlayer, addResult.slot!, 5);
    
    expect(result.success).toBe(true);
    expect(result.price).toBe(25); // 5 * 20 * 0.25
    expect(mockPlayer.gold).toBe(initialGold + 25);
  });

  it('should prevent selling quest items', () => {
    const questItem = {
      id: 'quest_item',
      name: 'Quest Item',
      type: 'quest',
      rarity: Rarity.Common,
      level: 1,
      quantity: 1,
      value: 100
    };

    // Add quest item to inventory
    const addResult = vendorSystem.inventorySystem.addItem(mockPlayer, questItem);
    expect(addResult.success).toBe(true);

    const result = vendorSystem.sellItem(mockPlayer, addResult.slot!, 1);
    
    expect(result.success).toBe(false);
    expect(result.reason).toBe('Cannot sell quest items');
  });
});
