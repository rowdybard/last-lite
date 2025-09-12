import { Player, Quest, QuestState, QuestStep, QuestObjective, QuestReward } from '../shared/types';

export interface QuestProgress {
  questId: string;
  currentStep: number;
  objectives: Record<string, number>; // objectiveId -> progress
  completed: boolean;
  startedAt: number;
  completedAt?: number;
}

export class QuestSystem {
  private quests: Map<string, Quest> = new Map();
  private playerProgress: Map<string, QuestProgress[]> = new Map(); // playerId -> quest progress

  constructor() {
    this.initializeQuests();
  }

  private initializeQuests(): void {
    // FTUE Quest 1: Welcome to Last-Lite
    const welcomeQuest: Quest = {
      id: 'ftue_welcome',
      title: 'Welcome to Last-Lite',
      description: 'Learn the basics of the game',
      type: 'tutorial',
      level: 1,
      steps: [
        {
          id: 'welcome_step1',
          type: 'talk',
          title: 'Say Hello',
          description: 'Use the say command to greet the world',
          completed: false,
          objectives: [
            {
              id: 'say_hello',
              type: 'command',
              target: 'say',
              count: 1,
              description: 'Say hello to the world'
            }
          ],
          rewards: [
            {
              type: 'xp',
              amount: 50
            },
            {
              type: 'gold',
              amount: 10
            }
          ]
        }
      ],
      prerequisites: [],
      repeatable: false
    };

    // FTUE Quest 2: Movement Basics
    const movementQuest: Quest = {
      id: 'ftue_movement',
      title: 'Learning to Move',
      description: 'Master the art of movement',
      type: 'tutorial',
      level: 1,
      steps: [
        {
          id: 'movement_step1',
          type: 'reach',
          title: 'Move Around',
          description: 'Practice moving in different directions',
          completed: false,
          objectives: [
            {
              id: 'move_north',
              type: 'command',
              target: 'go north',
              count: 1,
              description: 'Move north'
            },
            {
              id: 'move_south',
              type: 'command',
              target: 'go south',
              count: 1,
              description: 'Move south'
            },
            {
              id: 'move_east',
              type: 'command',
              target: 'go east',
              count: 1,
              description: 'Move east'
            },
            {
              id: 'move_west',
              type: 'command',
              target: 'go west',
              count: 1,
              description: 'Move west'
            }
          ],
          rewards: [
            {
              type: 'xp',
              amount: 100
            },
            {
              type: 'gold',
              amount: 25
            }
          ]
        }
      ],
      prerequisites: ['ftue_welcome'],
      repeatable: false
    };

    // FTUE Quest 3: Combat Basics
    const combatQuest: Quest = {
      id: 'ftue_combat',
      title: 'First Battle',
      description: 'Learn the basics of combat',
      type: 'tutorial',
      level: 1,
      steps: [
        {
          id: 'combat_step1',
          type: 'kill',
          title: 'Attack a Mob',
          description: 'Find and attack a mob to learn combat',
          completed: false,
          objectives: [
            {
              id: 'attack_mob',
              type: 'combat',
              target: 'mob',
              count: 1,
              description: 'Attack and defeat a mob'
            }
          ],
          rewards: [
            {
              type: 'xp',
              amount: 200
            },
            {
              type: 'gold',
              amount: 50
            },
            {
              type: 'item',
              itemId: 'health_potion',
              quantity: 2
            }
          ]
        }
      ],
      prerequisites: ['ftue_movement'],
      repeatable: false
    };

    // FTUE Quest 4: Pet Companion
    const petQuest: Quest = {
      id: 'ftue_pet',
      title: 'Your First Pet',
      description: 'Adopt your first pet companion',
      type: 'tutorial',
      level: 1,
      steps: [
        {
          id: 'pet_step1',
          type: 'talk',
          title: 'Adopt a Pet',
          description: 'Use the pet command to adopt your first companion',
          completed: false,
          objectives: [
            {
              id: 'adopt_pet',
              type: 'command',
              target: 'pet adopt',
              count: 1,
              description: 'Adopt a pet companion'
            }
          ],
          rewards: [
            {
              type: 'xp',
              amount: 150
            },
            {
              type: 'gold',
              amount: 100
            },
            {
              type: 'pet',
              petType: 'wolf',
              level: 1
            }
          ]
        }
      ],
      prerequisites: ['ftue_combat'],
      repeatable: false
    };

    this.quests.set('ftue_welcome', welcomeQuest);
    this.quests.set('ftue_movement', movementQuest);
    this.quests.set('ftue_combat', combatQuest);
    this.quests.set('ftue_pet', petQuest);
  }

  startQuest(playerId: string, questId: string): { success: boolean; reason?: string } {
    const quest = this.quests.get(questId);
    if (!quest) {
      return { success: false, reason: 'Quest not found' };
    }

    const playerProgress = this.playerProgress.get(playerId) || [];
    
    // Check if already started
    if (playerProgress.some(p => p.questId === questId && !p.completed)) {
      return { success: false, reason: 'Quest already started' };
    }

    // Check prerequisites
    for (const prereqId of quest.prerequisites) {
      const prereqProgress = playerProgress.find(p => p.questId === prereqId);
      if (!prereqProgress || !prereqProgress.completed) {
        return { success: false, reason: 'Prerequisites not met' };
      }
    }

    // Start the quest
    const progress: QuestProgress = {
      questId,
      currentStep: 0,
      objectives: {},
      completed: false,
      startedAt: Date.now()
    };

    // Initialize objectives for first step
    if (quest.steps && quest.steps.length > 0) {
      const firstStep = quest.steps[0];
      if (firstStep.objectives) {
        for (const objective of firstStep.objectives) {
          progress.objectives[objective.id] = 0;
        }
      }
    }

    playerProgress.push(progress);
    this.playerProgress.set(playerId, playerProgress);

    return { success: true };
  }

  updateQuestProgress(playerId: string, objectiveType: string, target: string, count: number = 1): void {
    const playerProgress = this.playerProgress.get(playerId);
    if (!playerProgress) return;

    for (const progress of playerProgress) {
      if (progress.completed) continue;

      const quest = this.quests.get(progress.questId);
      if (!quest) continue;

      if (!quest.steps) continue;
      const currentStep = quest.steps[progress.currentStep];
      if (!currentStep) continue;

      if (!currentStep.objectives) continue;
      for (const objective of currentStep.objectives) {
        if (objective.type === objectiveType && objective.target === target) {
          const currentProgress = progress.objectives[objective.id] || 0;
          const newProgress = Math.min(currentProgress + count, objective.count);
          progress.objectives[objective.id] = newProgress;

          // Check if step is complete
          if (this.isStepComplete(progress, currentStep)) {
            this.completeStep(playerId, progress, quest, currentStep);
          }
        }
      }
    }
  }

  private isStepComplete(progress: QuestProgress, step: QuestStep): boolean {
    if (!step.objectives) return true;
    for (const objective of step.objectives) {
      const currentProgress = progress.objectives[objective.id] || 0;
      if (currentProgress < objective.count) {
        return false;
      }
    }
    return true;
  }

  private completeStep(playerId: string, progress: QuestProgress, quest: Quest, step: QuestStep): void {
    // Award rewards
    if (step.rewards) {
      for (const reward of step.rewards) {
        this.awardReward(playerId, reward);
      }
    }

    // Move to next step or complete quest
    progress.currentStep++;
    if (quest.steps && progress.currentStep >= quest.steps.length) {
      progress.completed = true;
      progress.completedAt = Date.now();
    } else if (quest.steps) {
      // Initialize objectives for next step
      const nextStep = quest.steps[progress.currentStep];
      if (nextStep && nextStep.objectives) {
        for (const objective of nextStep.objectives) {
          progress.objectives[objective.id] = 0;
        }
      }
    }
  }

  private awardReward(playerId: string, reward: QuestReward): void {
    // This would integrate with the player system to award rewards
    // For now, we'll just log the reward
    console.log(`Awarding reward to player ${playerId}:`, reward);
  }

  getPlayerQuests(playerId: string): QuestProgress[] {
    return this.playerProgress.get(playerId) || [];
  }

  getAvailableQuests(playerId: string): Quest[] {
    const playerProgress = this.playerProgress.get(playerId) || [];
    const availableQuests: Quest[] = [];

    for (const [questId, quest] of this.quests) {
      // Check if already completed (and not repeatable)
      const existingProgress = playerProgress.find(p => p.questId === questId);
      if (existingProgress && existingProgress.completed && !quest.repeatable) {
        continue;
      }

      // Check if already started
      if (existingProgress && !existingProgress.completed) {
        continue;
      }

      // Check prerequisites
      let prerequisitesMet = true;
      for (const prereqId of quest.prerequisites) {
        const prereqProgress = playerProgress.find(p => p.questId === prereqId);
        if (!prereqProgress || !prereqProgress.completed) {
          prerequisitesMet = false;
          break;
        }
      }

      if (prerequisitesMet) {
        availableQuests.push(quest);
      }
    }

    return availableQuests;
  }

  getQuest(questId: string): Quest | undefined {
    return this.quests.get(questId);
  }

  isQuestCompleted(playerId: string, questId: string): boolean {
    const playerProgress = this.playerProgress.get(playerId) || [];
    const progress = playerProgress.find(p => p.questId === questId);
    return progress ? progress.completed : false;
  }
}
