import { Shop, Item, PlayerState, ShopInventoryItem } from '../shared/types.js';

export class ShopService {
  private shops: Map<string, Shop> = new Map();
  private items: Map<string, Item> = new Map();

  constructor(shops: Shop[], items: Item[]) {
    shops.forEach(shop => {
      this.shops.set(shop.id, shop);
    });
    items.forEach(item => {
      this.items.set(item.id, item);
    });
  }

  getShop(shopId: string): Shop | null {
    return this.shops.get(shopId) || null;
  }

  getItem(itemId: string): Item | null {
    return this.items.get(itemId) || null;
  }

  getShopInventory(shopId: string): ShopInventoryItem[] {
    const shop = this.getShop(shopId);
    if (!shop) return [];

    return shop.inventory.map((shopItem: any) => {
      const item = this.getItem(shopItem.itemId);
      if (!item) return null;

      const price = shopItem.priceOverride || item.baseValue;
      return {
        item,
        stock: shopItem.stock,
        price
      };
    }).filter(Boolean) as ShopInventoryItem[];
  }

  canBuy(shopId: string, itemId: string, qty: number, player: PlayerState): { ok: boolean; reason?: string } {
    const shop = this.getShop(shopId);
    if (!shop) {
      return { ok: false, reason: 'Shop not found' };
    }

    const shopItem = shop.inventory.find(i => i.itemId === itemId);
    if (!shopItem) {
      return { ok: false, reason: 'Item not available' };
    }

    if (qty <= 0) {
      return { ok: false, reason: 'Invalid quantity' };
    }

    if (shopItem.stock !== -1 && shopItem.stock < qty) {
      return { ok: false, reason: 'Insufficient stock' };
    }

    const item = this.getItem(itemId);
    if (!item) {
      return { ok: false, reason: 'Item not found' };
    }

    const price = shopItem.priceOverride || item.baseValue;
    const totalCost = price * qty;

    if (player.gold < totalCost) {
      return { ok: false, reason: 'Insufficient gold' };
    }

    return { ok: true };
  }

  buyItem(shopId: string, itemId: string, qty: number, player: PlayerState): { ok: boolean; player: PlayerState; reason?: string } {
    const canBuy = this.canBuy(shopId, itemId, qty, player);
    if (!canBuy.ok) {
      return { ok: false, player, reason: canBuy.reason };
    }

    const shop = this.getShop(shopId);
    const shopItem = shop!.inventory.find((i: any) => i.itemId === itemId);
    const item = this.getItem(itemId)!;
    const price = shopItem!.priceOverride || item.baseValue;
    const totalCost = price * qty;

    const newPlayer = JSON.parse(JSON.stringify(player)); // Deep clone

    // Deduct gold
    newPlayer.gold -= totalCost;

    // Add item to inventory
    const existing = newPlayer.inventory.find((i: any) => i.itemId === itemId);
    if (existing) {
      existing.qty += qty;
    } else {
      newPlayer.inventory.push({ itemId, qty });
    }

    // Update shop stock (if not unlimited)
    if (shopItem!.stock !== -1) {
      shopItem!.stock -= qty;
    }

    return { ok: true, player: newPlayer };
  }

  canSell(shopId: string, itemId: string, qty: number, player: PlayerState): { ok: boolean; reason?: string } {
    const shop = this.getShop(shopId);
    if (!shop) {
      return { ok: false, reason: 'Shop not found' };
    }

    if (!shop.sellRules.enabled) {
      return { ok: false, reason: 'Shop does not buy items' };
    }

    if (qty <= 0) {
      return { ok: false, reason: 'Invalid quantity' };
    }

    const playerItem = player.inventory.find((i: any) => i.itemId === itemId);
    if (!playerItem || playerItem.qty < qty) {
      return { ok: false, reason: 'Insufficient items' };
    }

    const item = this.getItem(itemId);
    if (!item) {
      return { ok: false, reason: 'Item not found' };
    }

    if (shop.sellRules.blacklistItemTypes.includes(item.type)) {
      return { ok: false, reason: 'Cannot sell this item type' };
    }

    return { ok: true };
  }

  sellItem(shopId: string, itemId: string, qty: number, player: PlayerState): { ok: boolean; player: PlayerState; reason?: string } {
    const canSell = this.canSell(shopId, itemId, qty, player);
    if (!canSell.ok) {
      return { ok: false, player, reason: canSell.reason };
    }

    const shop = this.getShop(shopId);
    const item = this.getItem(itemId)!;
    const sellPrice = Math.floor(item.baseValue * shop!.sellRules.priceFactor);

    const newPlayer = JSON.parse(JSON.stringify(player)); // Deep clone

    // Add gold
    newPlayer.gold += sellPrice * qty;

    // Remove item from inventory
    const playerItem = newPlayer.inventory.find((i: any) => i.itemId === itemId);
    if (playerItem) {
      playerItem.qty -= qty;
      if (playerItem.qty <= 0) {
        newPlayer.inventory = newPlayer.inventory.filter((i: any) => i.itemId !== itemId);
      }
    }

    return { ok: true, player: newPlayer };
  }
}
