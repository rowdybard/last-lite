import { describe, it, expect, beforeEach } from 'vitest';
import { AISystem } from '../src/systems/ai.js';
import { Entity, AIState, EntityType, Position } from '@shared/types';

describe('AISystem', () => {
  let aiSystem: AISystem;
  let mockEntity: Entity;
  let mockPlayer: any;

  beforeEach(() => {
    aiSystem = new AISystem();
    
    mockEntity = {
      id: 'mob1',
      type: EntityType.Mob,
      pos: { x: 0, y: 0, z: 0 },
      hp: 100,
      maxHp: 100,
      aiState: AIState.Idle,
      spawnPos: { x: 0, y: 0, z: 0 },
      leashDistance: 10,
    };

    mockPlayer = {
      id: 'player1',
      pos: { x: 5, y: 0, z: 0 },
      hp: 100,
    };
  });

  it('should transition from Idle to Alert when player enters aggro radius', () => {
    const entities = new Map([['mob1', mockEntity]]);
    const players = new Map([['player1', mockPlayer]]);

    aiSystem.update(entities, players, 0.016);

    expect(mockEntity.aiState).toBe(AIState.Alert);
  });

  it('should transition from Alert to Chase when player is close enough', () => {
    mockEntity.aiState = AIState.Alert;
    mockPlayer.pos = { x: 3, y: 0, z: 0 }; // Between melee range and aggro radius

    const entities = new Map([['mob1', mockEntity]]);
    const players = new Map([['player1', mockPlayer]]);

    aiSystem.update(entities, players, 0.016);

    expect(mockEntity.aiState).toBe(AIState.Chase);
  });

  it('should transition from Chase to Attack when in melee range', () => {
    mockEntity.aiState = AIState.Chase;
    mockPlayer.pos = { x: 1, y: 0, z: 0 }; // In melee range

    const entities = new Map([['mob1', mockEntity]]);
    const players = new Map([['player1', mockPlayer]]);

    aiSystem.update(entities, players, 0.016);

    expect(mockEntity.aiState).toBe(AIState.Attack);
  });

  it('should transition from Attack to Chase when player moves away', () => {
    mockEntity.aiState = AIState.Attack;
    mockPlayer.pos = { x: 3, y: 0, z: 0 }; // Out of melee range

    const entities = new Map([['mob1', mockEntity]]);
    const players = new Map([['player1', mockPlayer]]);

    aiSystem.update(entities, players, 0.016);

    expect(mockEntity.aiState).toBe(AIState.Chase);
  });

  it('should leash back to spawn when player is too far', () => {
    mockEntity.aiState = AIState.Chase;
    mockEntity.leashDistance = 10; // Set leash distance
    mockEntity.pos = { x: 12, y: 0, z: 0 }; // Move entity far from spawn (distance 12 > leash 10)
    mockPlayer.pos = { x: 15, y: 0, z: 0 }; // Player is far away

    const entities = new Map([['mob1', mockEntity]]);
    const players = new Map([['player1', mockPlayer]]);

    aiSystem.update(entities, players, 0.016);

    expect(mockEntity.aiState).toBe(AIState.Reset);
  });

  it('should reset HP when leashing back to spawn', () => {
    mockEntity.aiState = AIState.Reset;
    mockEntity.hp = 50; // Damaged

    const entities = new Map([['mob1', mockEntity]]);
    const players = new Map([['player1', mockPlayer]]);

    aiSystem.update(entities, players, 0.016);

    expect(mockEntity.hp).toBe(mockEntity.maxHp);
    expect(mockEntity.aiState).toBe(AIState.Idle);
  });

  it('should move entity towards target when chasing', () => {
    mockEntity.aiState = AIState.Chase;
    mockPlayer.pos = { x: 5, y: 0, z: 0 };

    const entities = new Map([['mob1', mockEntity]]);
    const players = new Map([['player1', mockPlayer]]);

    const initialPos = { ...mockEntity.pos };
    aiSystem.update(entities, players, 0.016);

    // Entity should move towards player
    expect(mockEntity.pos.x).toBeGreaterThan(initialPos.x);
  });

  it('should move entity back to spawn when resetting', () => {
    mockEntity.aiState = AIState.Reset;
    mockEntity.pos = { x: 10, y: 0, z: 0 }; // Away from spawn

    const entities = new Map([['mob1', mockEntity]]);
    const players = new Map([['player1', mockPlayer]]);

    aiSystem.update(entities, players, 0.016);

    // Entity should move towards spawn
    expect(mockEntity.pos.x).toBeLessThan(10);
  });

  it('should not move when in Idle state', () => {
    mockEntity.aiState = AIState.Idle;
    mockPlayer.pos = { x: 20, y: 0, z: 0 }; // Far away

    const entities = new Map([['mob1', mockEntity]]);
    const players = new Map([['player1', mockPlayer]]);

    const initialPos = { ...mockEntity.pos };
    aiSystem.update(entities, players, 0.016);

    // Entity should not move
    expect(mockEntity.pos).toEqual(initialPos);
  });

  it('should handle multiple players correctly', () => {
    const player2 = {
      id: 'player2',
      pos: { x: 3, y: 0, z: 0 },
      hp: 100,
    };

    const entities = new Map([['mob1', mockEntity]]);
    const players = new Map([
      ['player1', mockPlayer],
      ['player2', player2],
    ]);

    aiSystem.update(entities, players, 0.016);

    // Should target the closest player
    expect(mockEntity.aiState).toBe(AIState.Alert);
  });
});
