import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InventorySystem } from '../src/systems/inventory';
import { Player, CharacterClass, Rarity } from '../shared/types';

describe('InventorySystem', () => {
  let inventorySystem: InventorySystem;
  let mockPlayer: Player;

  beforeEach(() => {
    inventorySystem = new InventorySystem();
    
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
      gold: 100,
      buffs: [],
      lastGcd: 0,
      abilityCooldowns: new Map(),
    };
  });

  it('should add items to inventory', () => {
    const item = {
      id: 'health_potion',
      name: 'Health Potion',
      type: 'consumable' as any,
      rarity: Rarity.Common,
      level: 1,
      quantity: 1,
      value: 10
    };

    const result = inventorySystem.addItem(mockPlayer, item);
    
    expect(result.success).toBe(true);
    expect(result.slot).toBeDefined();
    expect(result.slot).toBeGreaterThanOrEqual(0);
  });

  it('should stack identical items', () => {
    const item = {
      id: 'health_potion',
      name: 'Health Potion',
      type: 'consumable' as any,
      rarity: Rarity.Common,
      level: 1,
      quantity: 1,
      value: 10
    };

    // Add first item
    const result1 = inventorySystem.addItem(mockPlayer, item);
    expect(result1.success).toBe(true);

    // Add second identical item
    const result2 = inventorySystem.addItem(mockPlayer, item);
    expect(result2.success).toBe(true);
    expect(result2.slot).toBe(result1.slot); // Should stack in same slot

    // Check quantity
    const inventory = inventorySystem.getInventory(mockPlayer);
    const slot = inventory.get(result1.slot!);
    expect(slot?.quantity).toBe(2);
  });

  it('should prevent adding items when inventory is full', () => {
    // Fill inventory with items
    for (let i = 0; i < 20; i++) { // Assuming 20 slot inventory
      const item = {
        id: `item_${i}`,
        name: `Item ${i}`,
        type: 'misc' as any,
        rarity: Rarity.Common,
        level: 1,
        quantity: 1,
        value: 1
      };
      
      inventorySystem.addItem(mockPlayer, item);
    }

    // Try to add one more item
    const item = {
      id: 'overflow_item',
      name: 'Overflow Item',
      type: 'misc' as any,
      rarity: Rarity.Common,
      level: 1,
      quantity: 1,
      value: 1
    };

    const result = inventorySystem.addItem(mockPlayer, item);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('Inventory full');
  });

  it('should remove items from inventory', () => {
    const item = {
      id: 'test_item',
      name: 'Test Item',
      type: 'misc' as any,
      rarity: Rarity.Common,
      level: 1,
      quantity: 1,
      value: 10
    };

    // Add item
    const addResult = inventorySystem.addItem(mockPlayer, item);
    expect(addResult.success).toBe(true);

    // Remove item
    const removeResult = inventorySystem.removeItem(mockPlayer, addResult.slot!, 1);
    expect(removeResult.success).toBe(true);
    expect(removeResult.item).toEqual(item);

    // Check inventory is empty
    const inventory = inventorySystem.getInventory(mockPlayer);
    expect(inventory.get(addResult.slot!)).toBeUndefined();
  });

  it('should handle partial item removal', () => {
    const item = {
      id: 'stackable_item',
      name: 'Stackable Item',
      type: 'misc' as any,
      rarity: Rarity.Common,
      level: 1,
      quantity: 5,
      value: 10
    };

    // Add 5 items
    const addResult = inventorySystem.addItem(mockPlayer, item);
    expect(addResult.success).toBe(true);

    // Remove 3 items
    const removeResult = inventorySystem.removeItem(mockPlayer, addResult.slot!, 3);
    expect(removeResult.success).toBe(true);
    expect(removeResult.item?.quantity).toBe(3);

    // Check remaining quantity
    const inventory = inventorySystem.getInventory(mockPlayer);
    const slot = inventory.get(addResult.slot!);
    expect(slot?.quantity).toBe(2);
  });

  it('should prevent removing more items than available', () => {
    const item = {
      id: 'limited_item',
      name: 'Limited Item',
      type: 'misc' as any,
      rarity: Rarity.Common,
      level: 1,
      quantity: 2,
      value: 10
    };

    // Add 2 items
    const addResult = inventorySystem.addItem(mockPlayer, item);
    expect(addResult.success).toBe(true);

    // Try to remove 5 items
    const removeResult = inventorySystem.removeItem(mockPlayer, addResult.slot!, 5);
    expect(removeResult.success).toBe(false);
    expect(removeResult.reason).toBe('Insufficient quantity');
  });

  it('should find items by ID', () => {
    const item = {
      id: 'findable_item',
      name: 'Findable Item',
      type: 'misc' as any,
      rarity: Rarity.Common,
      level: 1,
      quantity: 1,
      value: 10
    };

    inventorySystem.addItem(mockPlayer, item);
    
    const foundSlots = inventorySystem.findItems(mockPlayer, 'findable_item');
    expect(foundSlots.length).toBe(1);
    expect(foundSlots[0].slot).toBeDefined();
    expect(foundSlots[0].item.id).toBe('findable_item');
  });

  it('should get inventory contents', () => {
    const item1 = {
      id: 'item_1',
      name: 'Item 1',
      type: 'misc' as any,
      rarity: Rarity.Common,
      level: 1,
      quantity: 1,
      value: 10
    };

    const item2 = {
      id: 'item_2',
      name: 'Item 2',
      type: 'misc' as any,
      rarity: Rarity.Uncommon,
      level: 2,
      quantity: 3,
      value: 25
    };

    inventorySystem.addItem(mockPlayer, item1);
    inventorySystem.addItem(mockPlayer, item2);

    const inventory = inventorySystem.getInventory(mockPlayer);
    expect(inventory.size).toBe(2);
    
    // Check that both items are in inventory
    const items = Array.from(inventory.values());
    const itemIds = items.map(item => item.id);
    expect(itemIds).toContain('item_1');
    expect(itemIds).toContain('item_2');
  });

  it('should handle gold transactions', () => {
    const initialGold = mockPlayer.gold;
    
    // Add gold
    const addResult = inventorySystem.addGold(mockPlayer, 50);
    expect(addResult.success).toBe(true);
    expect(mockPlayer.gold).toBe(initialGold + 50);

    // Remove gold
    const removeResult = inventorySystem.removeGold(mockPlayer, 25);
    expect(removeResult.success).toBe(true);
    expect(mockPlayer.gold).toBe(initialGold + 25);

    // Try to remove more gold than available
    const failResult = inventorySystem.removeGold(mockPlayer, 1000);
    expect(failResult.success).toBe(false);
    expect(failResult.reason).toBe('Insufficient gold');
  });

  it('should calculate inventory value', () => {
    const item1 = {
      id: 'valuable_item',
      name: 'Valuable Item',
      type: 'misc' as any,
      rarity: Rarity.Rare,
      level: 5,
      quantity: 2,
      value: 100
    };

    inventorySystem.addItem(mockPlayer, item1);
    
    const totalValue = inventorySystem.getInventoryValue(mockPlayer);
    expect(totalValue).toBe(200); // 2 items * 100 value each
  });
});
