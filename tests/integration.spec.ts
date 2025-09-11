import { describe, it, expect } from 'vitest';
import { QuestService } from '../server/src/services/quests';
import { ShopService } from '../server/src/services/shop';
import { DialogueService } from '../server/src/services/dialogue';
import { Quest, Item, Shop, DialogueNode, PlayerState } from '../server/src/shared/types';

describe('Integration Tests', () => {
  it('should handle complete quest flow', () => {
    // Setup test data
    const testQuest: Quest = {
      id: 'q_test',
      title: 'Test Quest',
      giverId: 'npc_test',
      summary: 'A test quest',
      description: 'Complete this test quest',
      objectives: [
        { type: 'collect', itemId: 'itm_test', qty: 3 }
      ],
      rewards: {
        xp: 50,
        gold: 20,
        items: [{ itemId: 'itm_reward', qty: 1 }]
      },
      prerequisites: [],
      repeatable: false
    };

    const testItem: Item = {
      id: 'itm_test',
      name: 'Test Item',
      type: 'material',
      desc: 'A test item',
      stack: 99,
      baseValue: 5
    };

    const testPlayer: PlayerState = {
      gold: 100,
      inventory: [{ itemId: 'itm_test', qty: 3 }],
      questLog: [],
      flags: {}
    };

    // Test quest system
    const questService = new QuestService([testQuest]);
    
    // Start quest
    const startResult = questService.startQuest('q_test', testPlayer);
    expect(startResult.ok).toBe(true);
    expect(startResult.player.questLog).toHaveLength(1);
    expect(startResult.player.questLog[0].state).toBe('InProgress');

    // Complete quest
    const completeResult = questService.completeQuest('q_test', startResult.player);
    expect(completeResult.ok).toBe(true);
    expect(completeResult.player.questLog[0].state).toBe('Completed');
    expect(completeResult.player.gold).toBe(120); // 100 + 20
    expect(completeResult.player.inventory.find(i => i.itemId === 'itm_reward')?.qty).toBe(1);
  });

  it('should handle shop buy/sell flow', () => {
    const testItem: Item = {
      id: 'itm_test',
      name: 'Test Item',
      type: 'consumable',
      desc: 'A test item',
      stack: 10,
      baseValue: 10
    };

    const testShop: Shop = {
      id: 'shop_test',
      vendorId: 'npc_test',
      buybackLimit: 5,
      inventory: [
        { itemId: 'itm_test', stock: 5 }
      ],
      sellRules: {
        enabled: true,
        priceFactor: 0.5,
        blacklistItemTypes: ['quest']
      }
    };

    const testPlayer: PlayerState = {
      gold: 100,
      inventory: [],
      questLog: [],
      flags: {}
    };

    const shopService = new ShopService([testShop], [testItem]);

    // Buy item
    const buyResult = shopService.buyItem('shop_test', 'itm_test', 2, testPlayer);
    expect(buyResult.ok).toBe(true);
    expect(buyResult.player.gold).toBe(80); // 100 - (10 * 2)
    expect(buyResult.player.inventory[0].qty).toBe(2);

    // Sell item back
    const sellResult = shopService.sellItem('shop_test', 'itm_test', 1, buyResult.player);
    expect(sellResult.ok).toBe(true);
    expect(sellResult.player.gold).toBe(85); // 80 + (10 * 0.5)
    expect(sellResult.player.inventory[0].qty).toBe(1);
  });
});
