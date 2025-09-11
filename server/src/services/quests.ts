import { Quest, PlayerState, QuestLogEntry, QuestRewards } from '../../shared/types.js';

export class QuestService {
  private quests: Map<string, Quest> = new Map();

  constructor(quests: Quest[]) {
    quests.forEach(quest => {
      this.quests.set(quest.id, quest);
    });
  }

  getQuest(questId: string): Quest | null {
    return this.quests.get(questId) || null;
  }

  getAllQuests(): Quest[] {
    return Array.from(this.quests.values());
  }

  canStartQuest(questId: string, player: PlayerState): { ok: boolean; reason?: string } {
    const quest = this.getQuest(questId);
    if (!quest) {
      return { ok: false, reason: 'Quest not found' };
    }

    // Check if already started
    const existing = player.questLog.find(q => q.questId === questId);
    if (existing && existing.state !== 'NotStarted') {
      return { ok: false, reason: 'Quest already started' };
    }

    // Check prerequisites
    for (const prereqId of quest.prerequisites) {
      const prereq = player.questLog.find(q => q.questId === prereqId);
      if (!prereq || prereq.state !== 'Completed') {
        return { ok: false, reason: `Prerequisite quest ${prereqId} not completed` };
      }
    }

    return { ok: true };
  }

  startQuest(questId: string, player: PlayerState): { ok: boolean; player: PlayerState; reason?: string } {
    const canStart = this.canStartQuest(questId, player);
    if (!canStart.ok) {
      return { ok: false, player, reason: canStart.reason };
    }

    const newPlayer = JSON.parse(JSON.stringify(player)); // Deep clone
    
    // Add or update quest in log
    const existingIndex = newPlayer.questLog.findIndex(q => q.questId === questId);
    const questEntry: QuestLogEntry = {
      questId,
      state: 'InProgress',
      progress: {}
    };

    if (existingIndex >= 0) {
      newPlayer.questLog[existingIndex] = questEntry;
    } else {
      newPlayer.questLog.push(questEntry);
    }

    return { ok: true, player: newPlayer };
  }

  canCompleteQuest(questId: string, player: PlayerState): { ok: boolean; reason?: string } {
    const quest = this.getQuest(questId);
    if (!quest) {
      return { ok: false, reason: 'Quest not found' };
    }

    const questEntry = player.questLog.find(q => q.questId === questId);
    if (!questEntry || questEntry.state !== 'InProgress') {
      return { ok: false, reason: 'Quest not in progress' };
    }

    // Check objectives
    for (const objective of quest.objectives) {
      if (objective.type === 'collect' && objective.itemId && objective.qty) {
        const item = player.inventory.find(i => i.itemId === objective.itemId);
        if (!item || item.qty < objective.qty) {
          return { ok: false, reason: `Need ${objective.qty} ${objective.itemId}` };
        }
      }
    }

    return { ok: true };
  }

  completeQuest(questId: string, player: PlayerState): { ok: boolean; player: PlayerState; rewards?: QuestRewards; reason?: string } {
    const canComplete = this.canCompleteQuest(questId, player);
    if (!canComplete.ok) {
      return { ok: false, player, reason: canComplete.reason };
    }

    const quest = this.getQuest(questId);
    if (!quest) {
      return { ok: false, player, reason: 'Quest not found' };
    }

    const newPlayer = JSON.parse(JSON.stringify(player)); // Deep clone

    // Remove required items
    for (const objective of quest.objectives) {
      if (objective.type === 'collect' && objective.itemId && objective.qty) {
        const item = newPlayer.inventory.find(i => i.itemId === objective.itemId);
        if (item) {
          item.qty -= objective.qty;
          if (item.qty <= 0) {
            newPlayer.inventory = newPlayer.inventory.filter(i => i.itemId !== objective.itemId);
          }
        }
      }
    }

    // Give rewards
    newPlayer.gold += quest.rewards.gold;
    
    if (quest.rewards.items) {
      for (const rewardItem of quest.rewards.items) {
        const existing = newPlayer.inventory.find(i => i.itemId === rewardItem.itemId);
        if (existing) {
          existing.qty += rewardItem.qty;
        } else {
          newPlayer.inventory.push({ itemId: rewardItem.itemId, qty: rewardItem.qty });
        }
      }
    }

    // Update quest state
    const questEntry = newPlayer.questLog.find(q => q.questId === questId);
    if (questEntry) {
      questEntry.state = 'Completed';
    }

    return { ok: true, player: newPlayer, rewards: quest.rewards };
  }
}
