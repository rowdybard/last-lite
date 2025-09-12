import { Player, EntityType } from '../shared/types.js';

export interface DungeonInstance {
  id: string;
  type: string;
  players: string[];
  status: 'active' | 'completed' | 'failed';
  createdAt: number;
  completedAt?: number;
  failureReason?: string;
  objectives: DungeonObjective[];
  entities: Map<string, any>;
}

export interface DungeonObjective {
  id: string;
  type: 'kill' | 'collect' | 'survive' | 'reach';
  target: string;
  count: number;
  completed: boolean;
}

export interface DungeonCreationResult {
  canCreate: boolean;
  reason?: string;
  dungeon?: DungeonInstance;
}

export interface DungeonOperationResult {
  success: boolean;
  reason?: string;
}

export class DungeonSystem {
  private dungeons: Map<string, DungeonInstance> = new Map();
  private dungeonTypes: Map<string, DungeonTypeConfig> = new Map();

  constructor() {
    this.initializeDungeonTypes();
  }

  private initializeDungeonTypes(): void {
    // Define dungeon types and their requirements
    this.dungeonTypes.set('test-dungeon', {
      name: 'Test Dungeon',
      minLevel: 3,
      maxLevel: 10,
      minPartySize: 2,
      maxPartySize: 3,
      objectives: [
        { id: 'kill-boss', type: 'kill', target: 'boss', count: 1, completed: false }
      ]
    });

    this.dungeonTypes.set('spider-cave', {
      name: 'Spider Cave',
      minLevel: 5,
      maxLevel: 15,
      minPartySize: 2,
      maxPartySize: 4,
      objectives: [
        { id: 'kill-spiders', type: 'kill', target: 'spider', count: 10, completed: false },
        { id: 'kill-queen', type: 'kill', target: 'spider-queen', count: 1, completed: false }
      ]
    });
  }

  canCreateDungeon(dungeonType: string, players: Player[]): DungeonCreationResult {
    const config = this.dungeonTypes.get(dungeonType);
    if (!config) {
      return { canCreate: false, reason: 'Unknown dungeon type' };
    }

    if (players.length < config.minPartySize) {
      return { canCreate: false, reason: 'Minimum party size is ' + config.minPartySize + ' players' };
    }

    if (players.length > config.maxPartySize) {
      return { canCreate: false, reason: 'Maximum party size is ' + config.maxPartySize + ' players' };
    }

    // Check if all players meet level requirements
    for (const player of players) {
      if (player.level < config.minLevel) {
        return { canCreate: false, reason: 'Player level too low for this dungeon' };
      }
      if (player.level > config.maxLevel) {
        return { canCreate: false, reason: 'Player level too high for this dungeon' };
      }
    }

    return { canCreate: true };
  }

  createDungeon(dungeonType: string, players: Player[]): DungeonInstance {
    const config = this.dungeonTypes.get(dungeonType);
    if (!config) {
      throw new Error('Unknown dungeon type: ' + dungeonType);
    }

    const validation = this.canCreateDungeon(dungeonType, players);
    if (!validation.canCreate) {
      throw new Error(validation.reason);
    }

    const dungeon: DungeonInstance = {
      id: this.generateDungeonId(),
      type: dungeonType,
      players: players.map(p => p.id),
      status: 'active',
      createdAt: Date.now(),
      objectives: config.objectives.map(obj => ({ ...obj, completed: false })),
      entities: new Map()
    };

    this.dungeons.set(dungeon.id, dungeon);
    return dungeon;
  }

  addPlayerToDungeon(dungeonId: string, player: Player): DungeonOperationResult {
    const dungeon = this.dungeons.get(dungeonId);
    if (!dungeon) {
      return { success: false, reason: 'Dungeon not found' };
    }

    if (dungeon.status !== 'active') {
      return { success: false, reason: 'Dungeon is not active' };
    }

    const config = this.dungeonTypes.get(dungeon.type);
    if (!config) {
      return { success: false, reason: 'Invalid dungeon configuration' };
    }

    if (dungeon.players.length >= config.maxPartySize) {
      return { success: false, reason: 'Dungeon is full' };
    }

    dungeon.players.push(player.id);
    return { success: true };
  }

  removePlayerFromDungeon(dungeonId: string, playerId: string): DungeonOperationResult {
    const dungeon = this.dungeons.get(dungeonId);
    if (!dungeon) {
      return { success: false, reason: 'Dungeon not found' };
    }

    const playerIndex = dungeon.players.indexOf(playerId);
    if (playerIndex === -1) {
      return { success: false, reason: 'Player not in dungeon' };
    }

    dungeon.players.splice(playerIndex, 1);

    // If no players left, mark dungeon as failed
    if (dungeon.players.length === 0) {
      dungeon.status = 'failed';
      dungeon.failureReason = 'All players left';
    }

    return { success: true };
  }

  completeDungeon(dungeonId: string): DungeonOperationResult {
    const dungeon = this.dungeons.get(dungeonId);
    if (!dungeon) {
      return { success: false, reason: 'Dungeon not found' };
    }

    if (dungeon.status !== 'active') {
      return { success: false, reason: 'Dungeon is not active' };
    }

    dungeon.status = 'completed';
    dungeon.completedAt = Date.now();
    return { success: true };
  }

  failDungeon(dungeonId: string, reason: string): DungeonOperationResult {
    const dungeon = this.dungeons.get(dungeonId);
    if (!dungeon) {
      return { success: false, reason: 'Dungeon not found' };
    }

    dungeon.status = 'failed';
    dungeon.failureReason = reason;
    return { success: true };
  }

  getDungeon(dungeonId: string): DungeonInstance | undefined {
    return this.dungeons.get(dungeonId);
  }

  getActiveDungeons(): DungeonInstance[] {
    return Array.from(this.dungeons.values()).filter(d => d.status === 'active');
  }

  cleanupExpiredDungeons(): void {
    const now = Date.now();
    const cleanupTimeout = 30 * 60 * 1000; // 30 minutes

    for (const [id, dungeon] of this.dungeons.entries()) {
      if (dungeon.status === 'completed' && dungeon.completedAt) {
        if (now - dungeon.completedAt > cleanupTimeout) {
          this.dungeons.delete(id);
        }
      } else if (dungeon.status === 'failed') {
        if (now - dungeon.createdAt > cleanupTimeout) {
          this.dungeons.delete(id);
        }
      }
    }
  }

  private generateDungeonId(): string {
    return 'dungeon-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
}

interface DungeonTypeConfig {
  name: string;
  minLevel: number;
  maxLevel: number;
  minPartySize: number;
  maxPartySize: number;
  objectives: DungeonObjective[];
}
