import { DialogueNode, Requirement, Effect, PlayerState, QuestLogEntry } from '../../shared/types.js';

export interface RequirementCheck {
  ok: boolean;
  reasons: string[];
}

export interface EffectResult {
  player: PlayerState;
  errors: string[];
}

export class DialogueService {
  private dialogueNodes: Map<string, DialogueNode> = new Map();

  constructor(dialogueNodes: DialogueNode[]) {
    dialogueNodes.forEach(node => {
      this.dialogueNodes.set(node.id, node);
    });
  }

  getNode(nodeId: string): DialogueNode | null {
    return this.dialogueNodes.get(nodeId) || null;
  }

  checkRequirements(requirements: Requirement[], player: PlayerState): RequirementCheck {
    const reasons: string[] = [];

    for (const req of requirements) {
      switch (req.type) {
        case 'hasItem':
          if (req.itemId && req.qty) {
            const item = player.inventory.find(i => i.itemId === req.itemId);
            if (!item || item.qty < req.qty) {
              reasons.push(`Need ${req.qty} ${req.itemId}`);
            }
          }
          break;

        case 'questStateIs':
          if (req.questId && req.state) {
            const quest = player.questLog.find(q => q.questId === req.questId);
            if (!quest || quest.state !== req.state) {
              reasons.push(`Quest ${req.questId} must be ${req.state}`);
            }
          }
          break;

        case 'questCanTurnIn':
          if (req.questId) {
            const quest = player.questLog.find(q => q.questId === req.questId);
            if (!quest || quest.state !== 'InProgress') {
              reasons.push(`Quest ${req.questId} not ready to turn in`);
            } else {
              // Check if objectives are complete
              // This would need quest data to validate properly
              // For now, assume it's ready if quest is InProgress
            }
          }
          break;

        case 'goldAtLeast':
          if (req.amount && player.gold < req.amount) {
            reasons.push(`Need at least ${req.amount} gold`);
          }
          break;

        case 'flagTrue':
          if (req.flagName && !player.flags[req.flagName]) {
            reasons.push(`Flag ${req.flagName} not set`);
          }
          break;
      }
    }

    return {
      ok: reasons.length === 0,
      reasons
    };
  }

  applyEffects(effects: Effect[], player: PlayerState): EffectResult {
    const newPlayer = JSON.parse(JSON.stringify(player)); // Deep clone
    const errors: string[] = [];

    for (const effect of effects) {
      try {
        switch (effect.type) {
          case 'giveItem':
            if (effect.itemId && effect.qty) {
              const existing = newPlayer.inventory.find(i => i.itemId === effect.itemId);
              if (existing) {
                existing.qty += effect.qty;
              } else {
                newPlayer.inventory.push({ itemId: effect.itemId, qty: effect.qty });
              }
            }
            break;

          case 'takeItem':
            if (effect.itemId && effect.qty) {
              const existing = newPlayer.inventory.find(i => i.itemId === effect.itemId);
              if (existing && existing.qty >= effect.qty) {
                existing.qty -= effect.qty;
                if (existing.qty <= 0) {
                  newPlayer.inventory = newPlayer.inventory.filter(i => i.itemId !== effect.itemId);
                }
              } else {
                errors.push(`Cannot take ${effect.qty} ${effect.itemId}`);
              }
            }
            break;

          case 'questStart':
            if (effect.questId) {
              const existing = newPlayer.questLog.find(q => q.questId === effect.questId);
              if (!existing) {
                newPlayer.questLog.push({
                  questId: effect.questId,
                  state: 'InProgress',
                  progress: {}
                });
              }
            }
            break;

          case 'questComplete':
            if (effect.questId) {
              const quest = newPlayer.questLog.find(q => q.questId === effect.questId);
              if (quest) {
                quest.state = 'Completed';
              }
            }
            break;

          case 'giveGold':
            if (effect.amount) {
              newPlayer.gold += effect.amount;
            }
            break;

          case 'takeGold':
            if (effect.amount) {
              if (newPlayer.gold >= effect.amount) {
                newPlayer.gold -= effect.amount;
              } else {
                errors.push(`Insufficient gold`);
              }
            }
            break;

          case 'setFlag':
            if (effect.flagName) {
              newPlayer.flags[effect.flagName] = true;
            }
            break;
        }
      } catch (error) {
        errors.push(`Error applying effect ${effect.type}: ${error}`);
      }
    }

    return {
      player: newPlayer,
      errors
    };
  }

  isOptionVisible(option: any, player: PlayerState): boolean {
    if (!option.visibility) return true;

    const { questStateNot } = option.visibility;
    if (questStateNot) {
      const quest = player.questLog.find(q => q.questId === questStateNot.questId);
      if (quest) {
        const state = quest.state;
        if (questStateNot.state === 'InProgressOrBeyond') {
          return state !== 'InProgress' && state !== 'Completed' && state !== 'TurnedIn';
        }
        return state !== questStateNot.state;
      }
    }

    return true;
  }
}
