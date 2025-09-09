import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CombatSystem } from '../src/systems/combat';
import { getAbilityById } from '../src/data/abilities';
import { Player, Entity, CharacterClass, AIState } from '../shared/types';

describe('Combat Integration', () => {
  let combatSystem: CombatSystem;
  let mockPlayer: Player;
  let mockEntity: Entity;

  beforeEach(() => {
    combatSystem = new CombatSystem();
    
    mockPlayer = {
      id: 'player-1',
      name: 'TestPlayer',
      class: CharacterClass.Warrior,
      level: 1,
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
      lastGcd: 0,
      abilityCooldowns: new Map(),
    };

    mockEntity = {
      id: 'entity-1',
      name: 'Boarling',
      type: 'mob',
      pos: { x: 1, y: 0, z: 0 },
      vel: { vx: 0, vz: 0 },
      dir: 0,
      anim: 'idle',
      hp: 50,
      maxHp: 50,
      level: 1,
      aiState: AIState.Idle,
      spawnPos: { x: 0, y: 0, z: 0 },
      leashDistance: 10,
    };
  });

  it('should allow player to cast basic attack on nearby entity', () => {
    const slashAbility = getAbilityById('Slash');
    expect(slashAbility).toBeDefined();

    const result = combatSystem.tryCast(mockPlayer, slashAbility!, mockEntity);
    
    expect(result.success).toBe(true);
    expect(result.damage).toBeGreaterThan(0);
    expect(mockPlayer.lastGcd).toBeGreaterThan(0);
  });

  it('should prevent casting when on GCD', () => {
    const slashAbility = getAbilityById('Slash');
    mockPlayer.lastGcd = Date.now() - 500; // Recently used GCD

    const result = combatSystem.tryCast(mockPlayer, slashAbility!, mockEntity);
    
    expect(result.success).toBe(false);
    expect(result.reason).toBe('GCD');
  });

  it('should prevent casting when ability is on cooldown', () => {
    const whirlwindAbility = getAbilityById('Whirlwind');
    mockPlayer.abilityCooldowns.set('Whirlwind', Date.now() - 5000); // Recently used

    const result = combatSystem.tryCast(mockPlayer, whirlwindAbility!, mockEntity);
    
    expect(result.success).toBe(false);
    expect(result.reason).toBe('Cooldown');
  });

  it('should prevent casting when insufficient resources', () => {
    const whirlwindAbility = getAbilityById('Whirlwind');
    mockPlayer.mp = 5; // Not enough MP for Whirlwind (costs 15)

    const result = combatSystem.tryCast(mockPlayer, whirlwindAbility!, mockEntity);
    
    expect(result.success).toBe(false);
    expect(result.reason).toBe('Insufficient resources');
  });

  it('should prevent casting when target is out of range', () => {
    const slashAbility = getAbilityById('Slash');
    mockEntity.pos = { x: 10, y: 0, z: 0 }; // Too far for melee (range 2)

    const result = combatSystem.tryCast(mockPlayer, slashAbility!, mockEntity);
    
    expect(result.success).toBe(false);
    expect(result.reason).toBe('Target out of range');
  });

  it('should consume resources when casting', () => {
    const whirlwindAbility = getAbilityById('Whirlwind');
    const initialMp = mockPlayer.mp;

    const result = combatSystem.tryCast(mockPlayer, whirlwindAbility!, mockEntity);
    
    expect(result.success).toBe(true);
    expect(mockPlayer.mp).toBe(initialMp - whirlwindAbility!.cost);
  });

  it('should set cooldowns correctly', () => {
    const whirlwindAbility = getAbilityById('Whirlwind');
    const beforeCast = Date.now();

    const result = combatSystem.tryCast(mockPlayer, whirlwindAbility!, mockEntity);
    
    expect(result.success).toBe(true);
    expect(mockPlayer.abilityCooldowns.get('Whirlwind')).toBeGreaterThanOrEqual(beforeCast);
  });

  it('should calculate damage based on ability power and player stats', () => {
    const slashAbility = getAbilityById('Slash');
    mockPlayer.level = 5; // Higher level should do more damage

    const result = combatSystem.tryCast(mockPlayer, slashAbility!, mockEntity);
    
    expect(result.success).toBe(true);
    expect(result.damage).toBeGreaterThan(10); // Base power is 10
  });

  it('should handle different ability types correctly', () => {
    // Test melee ability
    const slashAbility = getAbilityById('Slash');
    const slashResult = combatSystem.tryCast(mockPlayer, slashAbility!, mockEntity);
    expect(slashResult.success).toBe(true);

    // Test AOE ability (reset player state to avoid GCD)
    mockPlayer.lastGcd = 0;
    mockPlayer.abilityCooldowns.clear();
    mockPlayer.mp = 50; // Reset MP
    const whirlwindAbility = getAbilityById('Whirlwind');
    const whirlwindResult = combatSystem.tryCast(mockPlayer, whirlwindAbility!, mockEntity);
    expect(whirlwindResult.success).toBe(true);
  });

  it('should allow casting without target for self-buff abilities', () => {
    const guardAbility = getAbilityById('Guard');
    
    const result = combatSystem.tryCast(mockPlayer, guardAbility!, null);
    
    expect(result.success).toBe(true);
    expect(result.damage).toBe(0); // No damage for self-buff
  });
});
