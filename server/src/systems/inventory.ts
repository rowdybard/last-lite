import { Player } from '../shared/types.js';

export interface InventoryItem {
  id: string;
  name: string;
  type: string;
  rarity: string;
  level: number;
  quantity: number;
  value: number;
}

export interface InventorySlot {
  slot: number;
  item: InventoryItem;
}

export interface InventoryResult {
  success: boolean;
  slot?: number;
  item?: InventoryItem;
  reason?: string;
}

export class InventorySystem {
  private readonly MAX_INVENTORY_SLOTS = 20;
  private inventories: Map<string, Map<number, InventoryItem>> = new Map();

  addItem(player: Player, item: InventoryItem): InventoryResult {
    const inventory = this.getInventory(player);
    
    // Try to stack with existing items first
    for (const [slot, existingItem] of inventory) {
      if (existingItem.id === item.id && existingItem.level === item.level) {
        existingItem.quantity += item.quantity;
        return { success: true, slot };
      }
    }

    // Find empty slot
    for (let slot = 0; slot < this.MAX_INVENTORY_SLOTS; slot++) {
      if (!inventory.has(slot)) {
        inventory.set(slot, { ...item });
        return { success: true, slot };
      }
    }

    return { success: false, reason: 'Inventory full' };
  }

  removeItem(player: Player, slot: number, quantity: number = 1): InventoryResult {
    const inventory = this.getInventory(player);
    const item = inventory.get(slot);

    if (!item) {
      return { success: false, reason: 'Slot empty' };
    }

    if (item.quantity < quantity) {
      return { success: false, reason: 'Insufficient quantity' };
    }

    const removedItem = { ...item, quantity };
    item.quantity -= quantity;

    if (item.quantity <= 0) {
      inventory.delete(slot);
    }

    return { success: true, item: removedItem };
  }

  findItems(player: Player, itemId: string): InventorySlot[] {
    const inventory = this.getInventory(player);
    const results: InventorySlot[] = [];

    for (const [slot, item] of inventory) {
      if (item.id === itemId) {
        results.push({ slot, item });
      }
    }

    return results;
  }

  getInventory(player: Player): Map<number, InventoryItem> {
    if (!this.inventories.has(player.id)) {
      this.inventories.set(player.id, new Map());
    }
    return this.inventories.get(player.id)!;
  }

  addGold(player: Player, amount: number): InventoryResult {
    if (amount < 0) {
      return { success: false, reason: 'Invalid amount' };
    }

    player.gold += amount;
    return { success: true };
  }

  removeGold(player: Player, amount: number): InventoryResult {
    if (amount < 0) {
      return { success: false, reason: 'Invalid amount' };
    }

    if (player.gold < amount) {
      return { success: false, reason: 'Insufficient gold' };
    }

    player.gold -= amount;
    return { success: true };
  }

  getInventoryValue(player: Player): number {
    const inventory = this.getInventory(player);
    let totalValue = 0;

    for (const item of inventory.values()) {
      totalValue += item.value * item.quantity;
    }

    return totalValue;
  }

  getUsedSlots(player: Player): number {
    return this.getInventory(player).size;
  }

  getAvailableSlots(player: Player): number {
    return this.MAX_INVENTORY_SLOTS - this.getUsedSlots(player);
  }

  isInventoryFull(player: Player): boolean {
    return this.getUsedSlots(player) >= this.MAX_INVENTORY_SLOTS;
  }

  clearInventory(player: Player): void {
    this.inventories.delete(player.id);
  }

  transferItem(fromPlayer: Player, toPlayer: Player, slot: number, quantity: number = 1): InventoryResult {
    // Remove from source player
    const removeResult = this.removeItem(fromPlayer, slot, quantity);
    if (!removeResult.success) {
      return removeResult;
    }

    // Add to target player
    const addResult = this.addItem(toPlayer, removeResult.item!);
    if (!addResult.success) {
      // Restore to source player if transfer failed
      this.addItem(fromPlayer, removeResult.item!);
      return addResult;
    }

    return { success: true };
  }

  getItemAtSlot(player: Player, slot: number): InventoryItem | undefined {
    return this.getInventory(player).get(slot);
  }

  swapItems(player: Player, slot1: number, slot2: number): InventoryResult {
    const inventory = this.getInventory(player);
    const item1 = inventory.get(slot1);
    const item2 = inventory.get(slot2);

    if (item1) {
      inventory.set(slot2, item1);
    } else {
      inventory.delete(slot2);
    }

    if (item2) {
      inventory.set(slot1, item2);
    } else {
      inventory.delete(slot1);
    }

    return { success: true };
  }
}
