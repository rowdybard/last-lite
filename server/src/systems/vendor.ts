import { Player, Rarity, RarityEnum } from '../shared/types.js';
import { InventorySystem, InventoryItem } from './inventory.js';

export interface VendorResult {
  success: boolean;
  cost?: number;
  price?: number;
  reason?: string;
}

export class VendorSystem {
  public inventorySystem: InventorySystem;
  private vendorInventory: InventoryItem[];

  constructor() {
    this.inventorySystem = new InventorySystem();
    this.vendorInventory = this.initializeVendorInventory();
  }

  buyItem(player: Player, item: InventoryItem, quantity: number = 1): VendorResult {
    const totalCost = item.value * quantity;

    // Check if player has enough gold
    if (player.gold < totalCost) {
      return { success: false, reason: 'Insufficient gold' };
    }

    // Check if player has inventory space
    const itemToAdd = { ...item, quantity };
    const addResult = this.inventorySystem.addItem(player, itemToAdd);
    
    if (!addResult.success) {
      return { success: false, reason: addResult.reason };
    }

    // Deduct gold
    player.gold -= totalCost;
    return { success: true, cost: totalCost };
  }

  sellItem(player: Player, slot: number, quantity: number = 1): VendorResult {
    const item = this.inventorySystem.getItemAtSlot(player, slot);
    
    if (!item) {
      return { success: false, reason: 'No item in slot' };
    }

    // Check if item can be sold
    if (item.type === 'quest') {
      return { success: false, reason: 'Cannot sell quest items' };
    }

    if (item.quantity < quantity) {
      return { success: false, reason: 'Insufficient quantity' };
    }

    const sellPrice = this.calculateSellPrice(item) * quantity;
    
    // Remove item from inventory
    const removeResult = this.inventorySystem.removeItem(player, slot, quantity);
    if (!removeResult.success) {
      return { success: false, reason: removeResult.reason };
    }

    // Add gold
    player.gold += sellPrice;
    return { success: true, price: sellPrice };
  }

  calculateSellPrice(item: InventoryItem): number {
    // Vendors buy items at 25% of their value
    return Math.floor(item.value * 0.25);
  }

  getVendorInventory(player?: Player): InventoryItem[] {
    if (!player) {
      return this.vendorInventory;
    }

    // Filter inventory based on player level
    return this.vendorInventory.filter(item => item.level <= player.level + 2);
  }

  private initializeVendorInventory(): InventoryItem[] {
    return [
      // Consumables
      {
        id: 'health_potion',
        name: 'Health Potion',
        type: 'consumable',
        rarity: RarityEnum.common,
        level: 1,
        quantity: 1,
        value: 50
      },
      {
        id: 'mana_potion',
        name: 'Mana Potion',
        type: 'consumable',
        rarity: RarityEnum.common,
        level: 1,
        quantity: 1,
        value: 50
      },
      {
        id: 'greater_health_potion',
        name: 'Greater Health Potion',
        type: 'consumable',
        rarity: RarityEnum.uncommon,
        level: 5,
        quantity: 1,
        value: 150
      },

      // Weapons
      {
        id: 'iron_sword',
        name: 'Iron Sword',
        type: 'weapon',
        rarity: RarityEnum.common,
        level: 1,
        quantity: 1,
        value: 200
      },
      {
        id: 'steel_sword',
        name: 'Steel Sword',
        type: 'weapon',
        rarity: RarityEnum.uncommon,
        level: 5,
        quantity: 1,
        value: 500
      },
      {
        id: 'enchanted_sword',
        name: 'Enchanted Sword',
        type: 'weapon',
        rarity: RarityEnum.rare,
        level: 10,
        quantity: 1,
        value: 1200
      },

      // Armor
      {
        id: 'leather_armor',
        name: 'Leather Armor',
        type: 'armor',
        rarity: RarityEnum.common,
        level: 2,
        quantity: 1,
        value: 300
      },
      {
        id: 'chain_mail',
        name: 'Chain Mail',
        type: 'armor',
        rarity: RarityEnum.uncommon,
        level: 6,
        quantity: 1,
        value: 800
      },
      {
        id: 'plate_armor',
        name: 'Plate Armor',
        type: 'armor',
        rarity: RarityEnum.rare,
        level: 12,
        quantity: 1,
        value: 2000
      },

      // Accessories
      {
        id: 'magic_ring',
        name: 'Magic Ring',
        type: 'accessory',
        rarity: RarityEnum.uncommon,
        level: 3,
        quantity: 1,
        value: 400
      },
      {
        id: 'power_amulet',
        name: 'Power Amulet',
        type: 'accessory',
        rarity: RarityEnum.rare,
        level: 8,
        quantity: 1,
        value: 1000
      },

      // Tools
      {
        id: 'lockpick',
        name: 'Lockpick',
        type: 'tool',
        rarity: RarityEnum.common,
        level: 1,
        quantity: 1,
        value: 25
      },
      {
        id: 'master_key',
        name: 'Master Key',
        type: 'tool',
        rarity: RarityEnum.rare,
        level: 15,
        quantity: 1,
        value: 5000
      }
    ];
  }

  getItemById(itemId: string): InventoryItem | undefined {
    return this.vendorInventory.find(item => item.id === itemId);
  }

  getItemsByType(type: string): InventoryItem[] {
    return this.vendorInventory.filter(item => item.type === type);
  }

  getItemsByRarity(rarity: Rarity): InventoryItem[] {
    return this.vendorInventory.filter(item => item.rarity === rarity);
  }

  getItemsByLevelRange(minLevel: number, maxLevel: number): InventoryItem[] {
    return this.vendorInventory.filter(item => 
      item.level >= minLevel && item.level <= maxLevel
    );
  }
}
