import { describe, it, expect, beforeEach } from 'vitest';
import { PartySystem } from '../src/systems/party';
import { Player } from '../shared/types';

describe('PartySystem', () => {
  let partySystem: PartySystem;
  let mockPlayer1: Player;
  let mockPlayer2: Player;
  let mockPlayer3: Player;

  beforeEach(() => {
    partySystem = new PartySystem();
    
    mockPlayer1 = {
      id: 'player-1',
      name: 'Player1',
      class: 'warrior' as any,
      level: 5,
      xp: 0,
      pos: { x: 0, y: 0, z: 0 },
      vel: { vx: 0, vz: 0 },
      dir: 0,
      anim: 'idle',
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      gold: 0,
      buffs: [],
      debuffs: [],
      lastGcd: 0,
      abilityCooldowns: new Map(),
      inventory: [],
      lastActivity: Date.now()
    };

    mockPlayer2 = {
      ...mockPlayer1,
      id: 'player-2',
      name: 'Player2',
      class: 'mage' as any
    };

    mockPlayer3 = {
      ...mockPlayer1,
      id: 'player-3',
      name: 'Player3',
      class: 'ranger' as any
    };
  });

  describe('party formation', () => {
    it('should create a new party', () => {
      const party = partySystem.createParty(mockPlayer1);
      
      expect(party).toBeDefined();
      expect(party.id).toBeDefined();
      expect(party.leader).toBe(mockPlayer1.id);
      expect(party.members).toContain(mockPlayer1.id);
      expect(party.status).toBe('active');
    });

    it('should add players to party', () => {
      const party = partySystem.createParty(mockPlayer1);
      
      const result = partySystem.addPlayerToParty(party.id, mockPlayer2);
      
      expect(result.success).toBe(true);
      expect(party.members).toContain(mockPlayer2.id);
    });

    it('should enforce maximum party size', () => {
      const party = partySystem.createParty(mockPlayer1);
      partySystem.addPlayerToParty(party.id, mockPlayer2);
      partySystem.addPlayerToParty(party.id, mockPlayer3);
      
      const extraPlayer = { ...mockPlayer1, id: 'player-4' };
      const result = partySystem.addPlayerToParty(party.id, extraPlayer);
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Party is full (max 3 players)');
    });

    it('should prevent adding players already in a party', () => {
      const party1 = partySystem.createParty(mockPlayer1);
      const party2 = partySystem.createParty(mockPlayer2);
      
      const result = partySystem.addPlayerToParty(party1.id, mockPlayer2);
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Player is already in a party');
    });
  });

  describe('party management', () => {
    it('should remove players from party', () => {
      const party = partySystem.createParty(mockPlayer1);
      partySystem.addPlayerToParty(party.id, mockPlayer2);
      
      const result = partySystem.removePlayerFromParty(party.id, mockPlayer2.id);
      
      expect(result.success).toBe(true);
      expect(party.members).not.toContain(mockPlayer2.id);
    });

    it('should transfer leadership when leader leaves', () => {
      const party = partySystem.createParty(mockPlayer1);
      partySystem.addPlayerToParty(party.id, mockPlayer2);
      
      partySystem.removePlayerFromParty(party.id, mockPlayer1.id);
      
      expect(party.leader).toBe(mockPlayer2.id);
      expect(party.members).not.toContain(mockPlayer1.id);
    });

    it('should disband party when last member leaves', () => {
      const party = partySystem.createParty(mockPlayer1);
      
      partySystem.removePlayerFromParty(party.id, mockPlayer1.id);
      
      expect(party.status).toBe('disbanded');
    });

    it('should allow leader to transfer leadership', () => {
      const party = partySystem.createParty(mockPlayer1);
      partySystem.addPlayerToParty(party.id, mockPlayer2);
      
      const result = partySystem.transferLeadership(party.id, mockPlayer1.id, mockPlayer2.id);
      
      expect(result.success).toBe(true);
      expect(party.leader).toBe(mockPlayer2.id);
    });

    it('should prevent non-leaders from transferring leadership', () => {
      const party = partySystem.createParty(mockPlayer1);
      partySystem.addPlayerToParty(party.id, mockPlayer2);
      
      const result = partySystem.transferLeadership(party.id, mockPlayer2.id, mockPlayer3.id);
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Only the party leader can transfer leadership');
    });
  });

  describe('party queries', () => {
    it('should get party by ID', () => {
      const party = partySystem.createParty(mockPlayer1);
      
      const foundParty = partySystem.getParty(party.id);
      
      expect(foundParty).toBe(party);
    });

    it('should get party by player ID', () => {
      const party = partySystem.createParty(mockPlayer1);
      
      const foundParty = partySystem.getPartyByPlayer(mockPlayer1.id);
      
      expect(foundParty).toBe(party);
    });

    it('should list all active parties', () => {
      const party1 = partySystem.createParty(mockPlayer1);
      const party2 = partySystem.createParty(mockPlayer2);
      
      const activeParties = partySystem.getActiveParties();
      
      expect(activeParties).toHaveLength(2);
      expect(activeParties).toContain(party1);
      expect(activeParties).toContain(party2);
    });

    it('should get party members', () => {
      const party = partySystem.createParty(mockPlayer1);
      partySystem.addPlayerToParty(party.id, mockPlayer2);
      
      const members = partySystem.getPartyMembers(party.id);
      
      expect(members).toHaveLength(2);
      expect(members).toContain(mockPlayer1.id);
      expect(members).toContain(mockPlayer2.id);
    });
  });

  describe('party experience sharing', () => {
    it('should share experience among party members', () => {
      const party = partySystem.createParty(mockPlayer1);
      partySystem.addPlayerToParty(party.id, mockPlayer2);
      
      const players = new Map<string, Player>();
      players.set(mockPlayer1.id, mockPlayer1);
      players.set(mockPlayer2.id, mockPlayer2);
      
      const xpGain = 100;
      partySystem.shareExperience(party.id, xpGain, players);
      
      // Each member should get full XP (no penalty for 2-member party)
      expect(mockPlayer1.xp).toBe(xpGain);
      expect(mockPlayer2.xp).toBe(xpGain);
    });

    it('should apply XP penalty for larger parties', () => {
      const party = partySystem.createParty(mockPlayer1);
      partySystem.addPlayerToParty(party.id, mockPlayer2);
      partySystem.addPlayerToParty(party.id, mockPlayer3);
      
      const players = new Map<string, Player>();
      players.set(mockPlayer1.id, mockPlayer1);
      players.set(mockPlayer2.id, mockPlayer2);
      players.set(mockPlayer3.id, mockPlayer3);
      
      const xpGain = 100;
      partySystem.shareExperience(party.id, xpGain, players);
      
      // 3-member party gets 80% XP each
      const expectedXp = Math.floor(xpGain * 0.8);
      expect(mockPlayer1.xp).toBe(expectedXp);
      expect(mockPlayer2.xp).toBe(expectedXp);
      expect(mockPlayer3.xp).toBe(expectedXp);
    });
  });

  describe('party loot sharing', () => {
    it('should distribute loot among party members', () => {
      const party = partySystem.createParty(mockPlayer1);
      partySystem.addPlayerToParty(party.id, mockPlayer2);
      
      const loot = {
        id: 'item-1',
        name: 'Test Item',
        type: 'weapon' as any,
        rarity: 'common' as any,
        level: 5,
        quantity: 1,
        value: 100
      };
      
      const result = partySystem.distributeLoot(party.id, loot);
      
      expect(result.success).toBe(true);
      expect(result.recipient).toBeDefined();
      expect([mockPlayer1.id, mockPlayer2.id]).toContain(result.recipient);
    });

    it('should handle need/greed loot system', () => {
      const party = partySystem.createParty(mockPlayer1);
      partySystem.addPlayerToParty(party.id, mockPlayer2);
      
      const loot = {
        id: 'item-1',
        name: 'Test Item',
        type: 'weapon' as any,
        rarity: 'rare' as any,
        level: 5,
        quantity: 1,
        value: 100
      };
      
      // Player1 needs, Player2 greeds
      partySystem.rollNeed(party.id, mockPlayer1.id, loot.id);
      partySystem.rollGreed(party.id, mockPlayer2.id, loot.id);
      
      const result = partySystem.resolveLootRoll(party.id, loot.id);
      
      expect(result.success).toBe(true);
      expect(result.winner).toBe(mockPlayer1.id); // Need beats greed
    });
  });
});
