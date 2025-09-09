import { describe, it, expect, beforeEach } from 'vitest';
import { QuestSystem } from '../src/systems/quest';

describe('QuestSystem', () => {
  let questSystem: QuestSystem;

  beforeEach(() => {
    questSystem = new QuestSystem();
  });

  describe('Quest Initialization', () => {
    it('should initialize with FTUE quests', () => {
      const welcomeQuest = questSystem.getQuest('ftue_welcome');
      expect(welcomeQuest).toBeDefined();
      expect(welcomeQuest?.title).toBe('Welcome to Last-Lite');
      expect(welcomeQuest?.type).toBe('tutorial');
      expect(welcomeQuest?.level).toBe(1);
    });

    it('should have quest prerequisites', () => {
      const movementQuest = questSystem.getQuest('ftue_movement');
      expect(movementQuest?.prerequisites).toContain('ftue_welcome');
    });
  });

  describe('Quest Starting', () => {
    it('should start a quest successfully', () => {
      const result = questSystem.startQuest('player1', 'ftue_welcome');
      expect(result.success).toBe(true);
    });

    it('should not start quest if prerequisites not met', () => {
      const result = questSystem.startQuest('player1', 'ftue_movement');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Prerequisites not met');
    });

    it('should not start quest if already started', () => {
      questSystem.startQuest('player1', 'ftue_welcome');
      const result = questSystem.startQuest('player1', 'ftue_welcome');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Quest already started');
    });

    it('should not start non-existent quest', () => {
      const result = questSystem.startQuest('player1', 'nonexistent');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Quest not found');
    });
  });

  describe('Quest Progress', () => {
    beforeEach(() => {
      questSystem.startQuest('player1', 'ftue_welcome');
    });

    it('should update quest progress for command objectives', () => {
      questSystem.updateQuestProgress('player1', 'command', 'say', 1);
      
      const playerQuests = questSystem.getPlayerQuests('player1');
      const welcomeQuest = playerQuests.find(q => q.questId === 'ftue_welcome');
      expect(welcomeQuest).toBeDefined();
      expect(welcomeQuest?.objectives.get('say_hello')).toBe(1);
    });

    it('should complete quest step when objectives are met', () => {
      questSystem.updateQuestProgress('player1', 'command', 'say', 1);
      
      const playerQuests = questSystem.getPlayerQuests('player1');
      const welcomeQuest = playerQuests.find(q => q.questId === 'ftue_welcome');
      expect(welcomeQuest?.completed).toBe(true);
    });

    it('should not exceed objective count', () => {
      questSystem.updateQuestProgress('player1', 'command', 'say', 5);
      
      const playerQuests = questSystem.getPlayerQuests('player1');
      const welcomeQuest = playerQuests.find(q => q.questId === 'ftue_welcome');
      expect(welcomeQuest?.objectives.get('say_hello')).toBe(1); // Should not exceed count
    });
  });

  describe('Quest Chain', () => {
    it('should allow starting next quest after completing prerequisite', () => {
      // Start and complete welcome quest
      questSystem.startQuest('player1', 'ftue_welcome');
      questSystem.updateQuestProgress('player1', 'command', 'say', 1);
      
      // Should be able to start movement quest
      const result = questSystem.startQuest('player1', 'ftue_movement');
      expect(result.success).toBe(true);
    });

    it('should track multiple quest steps', () => {
      questSystem.startQuest('player1', 'ftue_welcome');
      questSystem.updateQuestProgress('player1', 'command', 'say', 1);
      
      questSystem.startQuest('player1', 'ftue_movement');
      
      const playerQuests = questSystem.getPlayerQuests('player1');
      expect(playerQuests).toHaveLength(2);
      
      const movementQuest = playerQuests.find(q => q.questId === 'ftue_movement');
      expect(movementQuest?.currentStep).toBe(0);
      expect(movementQuest?.completed).toBe(false);
    });
  });

  describe('Available Quests', () => {
    it('should return available quests for new player', () => {
      const availableQuests = questSystem.getAvailableQuests('newplayer');
      expect(availableQuests).toHaveLength(1); // Only ftue_welcome should be available
      expect(availableQuests[0].id).toBe('ftue_welcome');
    });

    it('should not return completed non-repeatable quests', () => {
      questSystem.startQuest('player1', 'ftue_welcome');
      questSystem.updateQuestProgress('player1', 'command', 'say', 1);
      
      const availableQuests = questSystem.getAvailableQuests('player1');
      const welcomeQuest = availableQuests.find(q => q.id === 'ftue_welcome');
      expect(welcomeQuest).toBeUndefined();
    });

    it('should return next quest after completing prerequisite', () => {
      questSystem.startQuest('player1', 'ftue_welcome');
      questSystem.updateQuestProgress('player1', 'command', 'say', 1);
      
      const availableQuests = questSystem.getAvailableQuests('player1');
      const movementQuest = availableQuests.find(q => q.id === 'ftue_movement');
      expect(movementQuest).toBeDefined();
    });
  });

  describe('Quest Completion Status', () => {
    it('should correctly identify completed quests', () => {
      questSystem.startQuest('player1', 'ftue_welcome');
      questSystem.updateQuestProgress('player1', 'command', 'say', 1);
      
      expect(questSystem.isQuestCompleted('player1', 'ftue_welcome')).toBe(true);
      expect(questSystem.isQuestCompleted('player1', 'ftue_movement')).toBe(false);
    });

    it('should return false for non-existent quest', () => {
      expect(questSystem.isQuestCompleted('player1', 'nonexistent')).toBe(false);
    });
  });

  describe('Multi-step Quest Progress', () => {
    it('should handle multi-objective quest steps', () => {
      questSystem.startQuest('player1', 'ftue_welcome');
      questSystem.updateQuestProgress('player1', 'command', 'say', 1);
      
      questSystem.startQuest('player1', 'ftue_movement');
      
      // Complete all movement objectives
      questSystem.updateQuestProgress('player1', 'command', 'go north', 1);
      questSystem.updateQuestProgress('player1', 'command', 'go south', 1);
      questSystem.updateQuestProgress('player1', 'command', 'go east', 1);
      questSystem.updateQuestProgress('player1', 'command', 'go west', 1);
      
      const playerQuests = questSystem.getPlayerQuests('player1');
      const movementQuest = playerQuests.find(q => q.questId === 'ftue_movement');
      expect(movementQuest?.completed).toBe(true);
    });
  });
});
