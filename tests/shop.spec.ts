import { describe, it, expect, beforeEach } from 'vitest';
import { ShopService } from '../server/src/services/shop';
import { Shop, Item, PlayerState } from '../server/src/shared/types';

describe('Shop Service', () => {
  let shopService: ShopService;
  let testShop: Shop;
  let testItem: Item;
  let testPlayer: PlayerState;

  beforeEach(() => {
    testItem = {
      id: 'itm_test',
      name: 'Test Item',
      type: 'consumable',
      desc: 'A test item',
      stack: 10,
      baseValue: 10
    };

    testShop = {
      id: 'shop_test',
      vendorId: 'npc_test',
      buybackLimit: 5,
      inventory: [
        { itemId: 'itm_test', stock: 5, priceOverride: 12 }
      ],
      sellRules: {
        enabled: true,
        priceFactor: 0.5,
        blacklistItemTypes: ['quest']
      }
    };

    testPlayer = {
      gold: 100,
      inventory: [{ itemId: 'itm_test', qty: 3 }],
      questLog: [],
      flags: {}
    };

    shopService = new ShopService([testShop], [testItem]);
  });

  it('should allow buying with exact gold', () => {
    const result = shopService.buyItem('shop_test', 'itm_test', 1, testPlayer);
    
    expect(result.ok).toBe(true);
    expect(result.player.gold).toBe(88); // 100 - 12
    expect(result.player.inventory.find(i => i.itemId === 'itm_test')?.qty).toBe(4);
  });

  it('should fail buying with insufficient gold', () => {
    const poorPlayer = { ...testPlayer, gold: 5 };
    const result = shopService.buyItem('shop_test', 'itm_test', 1, poorPlayer);
    
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Insufficient gold');
  });

  it('should compute sell price correctly', () => {
    const result = shopService.sellItem('shop_test', 'itm_test', 1, testPlayer);
    
    expect(result.ok).toBe(true);
    expect(result.player.gold).toBe(105); // 100 + (10 * 0.5)
    expect(result.player.inventory.find(i => i.itemId === 'itm_test')?.qty).toBe(2);
  });

  it('should reject selling blacklisted item types', () => {
    const questItem = { ...testItem, type: 'quest' as const };
    const questShop = { ...testShop, inventory: [{ itemId: 'itm_quest', stock: 5 }] };
    const questPlayer = { ...testPlayer, inventory: [{ itemId: 'itm_quest', qty: 1 }] };
    
    const questShopService = new ShopService([questShop], [questItem]);
    const result = questShopService.sellItem('shop_test', 'itm_quest', 1, questPlayer);
    
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Cannot sell this item type');
  });
});
