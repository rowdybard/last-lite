import { describe, it, expect, beforeEach } from 'vitest';
import { QuestService } from '../server/src/services/quests';
import { Quest, PlayerState } from '../server/src/shared/types';

describe('Quest Service', () => {
  let questService: QuestService;
  let testQuest: Quest;
  let testPlayer: PlayerState;

  beforeEach(() => {
    testQuest = {
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

    testPlayer = {
      gold: 100,
      inventory: [],
      questLog: [],
      flags: {}
    };

    questService = new QuestService([testQuest]);
  });

  it('should start a quest successfully', () => {
    const result = questService.startQuest('q_test', testPlayer);
    
    expect(result.ok).toBe(true);
    expect(result.player.questLog).toHaveLength(1);
    expect(result.player.questLog[0].questId).toBe('q_test');
    expect(result.player.questLog[0].state).toBe('InProgress');
  });

  it('should not start a quest twice', () => {
    const startedPlayer = questService.startQuest('q_test', testPlayer).player;
    const result = questService.startQuest('q_test', startedPlayer);
    
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Quest already started');
  });

  it('should complete quest when objectives are met', () => {
    const playerWithItems = {
      ...testPlayer,
      inventory: [{ itemId: 'itm_test', qty: 3 }]
    };
    
    const startedPlayer = questService.startQuest('q_test', playerWithItems).player;
    const result = questService.completeQuest('q_test', startedPlayer);
    
    expect(result.ok).toBe(true);
    expect(result.player.questLog[0].state).toBe('Completed');
    expect(result.player.gold).toBe(120); // 100 + 20
    expect(result.player.inventory.find(i => i.itemId === 'itm_reward')?.qty).toBe(1);
    expect(result.player.inventory.find(i => i.itemId === 'itm_test')?.qty).toBe(0);
  });

  it('should not complete quest without required items', () => {
    const startedPlayer = questService.startQuest('q_test', testPlayer).player;
    const result = questService.completeQuest('q_test', startedPlayer);
    
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('Need 3 itm_test');
  });
});
