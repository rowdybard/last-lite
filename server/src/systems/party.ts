import { Player } from '../shared/types.js';

export interface Party {
  id: string;
  leader: string;
  members: string[];
  status: 'active' | 'disbanded';
  createdAt: number;
  lootRolls: Map<string, LootRoll>;
}

export interface LootRoll {
  itemId: string;
  rolls: Map<string, RollType>;
  resolved: boolean;
  winner?: string;
}

export interface PartyOperationResult {
  success: boolean;
  reason?: string;
}

export interface LootDistributionResult {
  success: boolean;
  recipient?: string;
  reason?: string;
}

export interface LootRollResult {
  success: boolean;
  winner?: string;
  reason?: string;
}

export type RollType = 'need' | 'greed' | 'pass';

export class PartySystem {
  private parties: Map<string, Party> = new Map();
  private playerParties: Map<string, string> = new Map(); // playerId -> partyId
  private readonly MAX_PARTY_SIZE = 3;

  createParty(leader: Player): Party {
    // Check if player is already in a party
    if (this.playerParties.has(leader.id)) {
      throw new Error('Player is already in a party');
    }

    const party: Party = {
      id: this.generatePartyId(),
      leader: leader.id,
      members: [leader.id],
      status: 'active',
      createdAt: Date.now(),
      lootRolls: new Map()
    };

    this.parties.set(party.id, party);
    this.playerParties.set(leader.id, party.id);
    return party;
  }

  addPlayerToParty(partyId: string, player: Player): PartyOperationResult {
    const party = this.parties.get(partyId);
    if (!party) {
      return { success: false, reason: 'Party not found' };
    }

    if (party.status !== 'active') {
      return { success: false, reason: 'Party is not active' };
    }

    if (party.members.length >= this.MAX_PARTY_SIZE) {
      return { success: false, reason: 'Party is full (max ' + this.MAX_PARTY_SIZE + ' players)' };
    }

    if (this.playerParties.has(player.id)) {
      return { success: false, reason: 'Player is already in a party' };
    }

    party.members.push(player.id);
    this.playerParties.set(player.id, partyId);
    return { success: true };
  }

  removePlayerFromParty(partyId: string, playerId: string): PartyOperationResult {
    const party = this.parties.get(partyId);
    if (!party) {
      return { success: false, reason: 'Party not found' };
    }

    const memberIndex = party.members.indexOf(playerId);
    if (memberIndex === -1) {
      return { success: false, reason: 'Player not in party' };
    }

    party.members.splice(memberIndex, 1);
    this.playerParties.delete(playerId);

    // Handle leadership transfer or disband
    if (playerId === party.leader) {
      if (party.members.length > 0) {
        // Transfer leadership to first remaining member
        party.leader = party.members[0];
      } else {
        // Disband party if no members left
        party.status = 'disbanded';
        this.parties.delete(partyId);
      }
    }

    return { success: true };
  }

  transferLeadership(partyId: string, currentLeaderId: string, newLeaderId: string): PartyOperationResult {
    const party = this.parties.get(partyId);
    if (!party) {
      return { success: false, reason: 'Party not found' };
    }

    if (party.leader !== currentLeaderId) {
      return { success: false, reason: 'Only the party leader can transfer leadership' };
    }

    if (!party.members.includes(newLeaderId)) {
      return { success: false, reason: 'New leader must be a party member' };
    }

    party.leader = newLeaderId;
    return { success: true };
  }

  getParty(partyId: string): Party | undefined {
    return this.parties.get(partyId);
  }

  getPartyByPlayer(playerId: string): Party | undefined {
    const partyId = this.playerParties.get(playerId);
    return partyId ? this.parties.get(partyId) : undefined;
  }

  getActiveParties(): Party[] {
    return Array.from(this.parties.values()).filter(p => p.status === 'active');
  }

  getPartyMembers(partyId: string): string[] {
    const party = this.parties.get(partyId);
    return party ? [...party.members] : [];
  }

  shareExperience(partyId: string, xpGain: number, players: Map<string, Player>): void {
    const party = this.parties.get(partyId);
    if (!party || party.status !== 'active') {
      return;
    }

    // Apply XP penalty based on party size
    let xpMultiplier = 1.0;
    if (party.members.length === 3) {
      xpMultiplier = 0.8; // 20% penalty for 3-member party
    } else if (party.members.length === 4) {
      xpMultiplier = 0.6; // 40% penalty for 4-member party
    }

    const sharedXp = Math.floor(xpGain * xpMultiplier);

    // Apply XP to all party members
    for (const memberId of party.members) {
      const player = players.get(memberId);
      if (player) {
        player.xp += sharedXp;
      }
    }
  }

  distributeLoot(partyId: string, loot: any): LootDistributionResult {
    const party = this.parties.get(partyId);
    if (!party || party.status !== 'active') {
      return { success: false, reason: 'Party not found or inactive' };
    }

    if (party.members.length === 1) {
      return { success: true, recipient: party.members[0] };
    }

    // For now, randomly distribute loot
    // In a real implementation, this would use the need/greed system
    const randomIndex = Math.floor(Math.random() * party.members.length);
    const recipient = party.members[randomIndex];

    return { success: true, recipient };
  }

  rollNeed(partyId: string, playerId: string, itemId: string): PartyOperationResult {
    const party = this.parties.get(partyId);
    if (!party || party.status !== 'active') {
      return { success: false, reason: 'Party not found or inactive' };
    }

    if (!party.members.includes(playerId)) {
      return { success: false, reason: 'Player not in party' };
    }

    if (!party.lootRolls.has(itemId)) {
      party.lootRolls.set(itemId, {
        itemId,
        rolls: new Map(),
        resolved: false
      });
    }

    const lootRoll = party.lootRolls.get(itemId)!;
    if (lootRoll.resolved) {
      return { success: false, reason: 'Loot roll already resolved' };
    }

    lootRoll.rolls.set(playerId, 'need');
    return { success: true };
  }

  rollGreed(partyId: string, playerId: string, itemId: string): PartyOperationResult {
    const party = this.parties.get(partyId);
    if (!party || party.status !== 'active') {
      return { success: false, reason: 'Party not found or inactive' };
    }

    if (!party.members.includes(playerId)) {
      return { success: false, reason: 'Player not in party' };
    }

    if (!party.lootRolls.has(itemId)) {
      party.lootRolls.set(itemId, {
        itemId,
        rolls: new Map(),
        resolved: false
      });
    }

    const lootRoll = party.lootRolls.get(itemId)!;
    if (lootRoll.resolved) {
      return { success: false, reason: 'Loot roll already resolved' };
    }

    lootRoll.rolls.set(playerId, 'greed');
    return { success: true };
  }

  resolveLootRoll(partyId: string, itemId: string): LootRollResult {
    const party = this.parties.get(partyId);
    if (!party || party.status !== 'active') {
      return { success: false, reason: 'Party not found or inactive' };
    }

    const lootRoll = party.lootRolls.get(itemId);
    if (!lootRoll) {
      return { success: false, reason: 'No loot roll found for item' };
    }

    if (lootRoll.resolved) {
      return { success: true, winner: lootRoll.winner };
    }

    // Find winner: need beats greed, then random among same type
    const needRolls = Array.from(lootRoll.rolls.entries()).filter(([_, type]) => type === 'need');
    const greedRolls = Array.from(lootRoll.rolls.entries()).filter(([_, type]) => type === 'greed');

    let winner: string;
    if (needRolls.length > 0) {
      // Random among need rolls
      const randomIndex = Math.floor(Math.random() * needRolls.length);
      winner = needRolls[randomIndex][0];
    } else if (greedRolls.length > 0) {
      // Random among greed rolls
      const randomIndex = Math.floor(Math.random() * greedRolls.length);
      winner = greedRolls[randomIndex][0];
    } else {
      return { success: false, reason: 'No rolls found' };
    }

    lootRoll.resolved = true;
    lootRoll.winner = winner;
    return { success: true, winner };
  }

  private generatePartyId(): string {
    return 'party-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
}
