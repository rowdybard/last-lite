import { describe, it, expect, beforeEach } from 'vitest';
import { DialogueService } from '../server/src/services/dialogue';
import { DialogueNode, PlayerState } from '../server/src/shared/types';

describe('NPC Dialogue System', () => {
  let dialogueService: DialogueService;
  let testPlayer: PlayerState;

  beforeEach(() => {
    const testDialogue: DialogueNode[] = [
      {
        id: 'dlg_test',
        npcId: 'npc_test',
        text: 'Hello there!',
        options: [
          { label: 'Hello!', next: 'end' },
          { label: 'Goodbye', next: 'end' }
        ]
      }
    ];

    dialogueService = new DialogueService(testDialogue);
    
    testPlayer = {
      gold: 100,
      inventory: [],
      questLog: [],
      flags: {}
    };
  });

  it('should get dialogue node by id', () => {
    const node = dialogueService.getNode('dlg_test');
    expect(node).toBeTruthy();
    expect(node?.id).toBe('dlg_test');
    expect(node?.text).toBe('Hello there!');
  });

  it('should return null for non-existent node', () => {
    const node = dialogueService.getNode('non_existent');
    expect(node).toBeNull();
  });

  it('should check requirements correctly', () => {
    const requirements = [
      { type: 'goldAtLeast' as const, amount: 50 },
      { type: 'goldAtLeast' as const, amount: 150 }
    ];

    const result = dialogueService.checkRequirements(requirements, testPlayer);
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain('Need at least 150 gold');
  });

  it('should apply effects correctly', () => {
    const effects = [
      { type: 'giveGold' as const, amount: 50 },
      { type: 'giveItem' as const, itemId: 'test_item', qty: 1 }
    ];

    const result = dialogueService.applyEffects(effects, testPlayer);
    expect(result.player.gold).toBe(150);
    expect(result.player.inventory).toHaveLength(1);
    expect(result.player.inventory[0].itemId).toBe('test_item');
  });
});
