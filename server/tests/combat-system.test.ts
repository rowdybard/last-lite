import { describe, it, expect, beforeEach } from 'vitest';
import { CombatSystem } from '../src/systems/combat.js';
import { Player, Entity, CharacterClass, Ability, AbilityType, CombatEvent, CombatEventType } from '@shared/types';

describe('CombatSystem', () => {
  let combatSystem: CombatSystem;
  let mockNow: () => number;
  let currentTime: number;

  beforeEach(() => {
    currentTime = 1000;
    mockNow = () => currentTime;
    combatSystem = new CombatSystem(mockNow);
  });

  it('should enforce global cooldown (GCD)', () => {
    const player: Player = {
      id: 'player1',
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

    const ability: Ability = {
      id: 'Slash',
      class: CharacterClass.Warrior,
      gcd: 1.0,
      cd: 0,
      cost: 0,
      range: 2,
      type: AbilityType.Melee,
      power: 10,
    };

    // First cast should succeed
    const result1 = combatSystem.tryCast(player, ability, null);
    expect(result1.success).toBe(true);
    expect(player.lastGcd).toBe(currentTime);

    // Second cast immediately should fail due to GCD
    const result2 = combatSystem.tryCast(player, ability, null);
    expect(result2.success).toBe(false);
    expect(result2.reason).toBe('GCD');

    // Advance time past GCD
    currentTime += 1100;
    const result3 = combatSystem.tryCast(player, ability, null);
    expect(result3.success).toBe(true);
  });

  it('should enforce ability cooldowns', () => {
    const player: Player = {
      id: 'player1',
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

    const ability: Ability = {
      id: 'Leap',
      class: CharacterClass.Warrior,
      gcd: 1.0,
      cd: 8.0,
      cost: 10,
      range: 5,
      type: AbilityType.Melee,
      power: 15,
    };

    // First cast should succeed
    const result1 = combatSystem.tryCast(player, ability, null);
    expect(result1.success).toBe(true);
    expect(player.abilityCooldowns.get('Leap')).toBe(currentTime);

    // Second cast should fail due to cooldown
    currentTime += 1000; // 1 second later
    const result2 = combatSystem.tryCast(player, ability, null);
    expect(result2.success).toBe(false);
    expect(result2.reason).toBe('Cooldown');

    // Advance time past cooldown
    currentTime += 8000; // 8 seconds later
    const result3 = combatSystem.tryCast(player, ability, null);
    expect(result3.success).toBe(true);
  });

  it('should check resource requirements', () => {
    const player: Player = {
      id: 'player1',
      name: 'TestPlayer',
      class: CharacterClass.Mage,
      level: 1,
      xp: 0,
      pos: { x: 0, y: 0, z: 0 },
      vel: { vx: 0, vz: 0 },
      dir: 0,
      anim: 'idle',
      hp: 100,
      maxHp: 100,
      mp: 5, // Low MP
      maxMp: 50,
      gold: 0,
      buffs: [],
      lastGcd: 0,
      abilityCooldowns: new Map(),
    };

    const ability: Ability = {
      id: 'Fireburst',
      class: CharacterClass.Mage,
      gcd: 1.0,
      cd: 0,
      cost: 20, // High MP cost
      range: 5,
      type: AbilityType.AOE,
      power: 25,
    };

    const result = combatSystem.tryCast(player, ability, null);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('Insufficient resources');
  });

  it('should check range requirements', () => {
    const player: Player = {
      id: 'player1',
      name: 'TestPlayer',
      class: CharacterClass.Ranger,
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

    const target: Entity = {
      id: 'target1',
      type: 'mob' as any,
      pos: { x: 10, y: 0, z: 0 }, // Far away
      hp: 100,
      maxHp: 100,
      aiState: 'idle' as any,
    };

    const ability: Ability = {
      id: 'Quickshot',
      class: CharacterClass.Ranger,
      gcd: 1.0,
      cd: 0,
      cost: 5,
      range: 5, // Short range
      type: AbilityType.Projectile,
      power: 12,
    };

    const result = combatSystem.tryCast(player, ability, target);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('Target out of range');
  });

  it('should calculate damage correctly', () => {
    const attacker: Player = {
      id: 'player1',
      name: 'TestPlayer',
      class: CharacterClass.Warrior,
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
      lastGcd: 0,
      abilityCooldowns: new Map(),
    };

    const target: Entity = {
      id: 'target1',
      type: 'mob' as any,
      pos: { x: 1, y: 0, z: 0 },
      hp: 100,
      maxHp: 100,
      aiState: 'idle' as any,
    };

    const ability: Ability = {
      id: 'Slash',
      class: CharacterClass.Warrior,
      gcd: 1.0,
      cd: 0,
      cost: 0,
      range: 2,
      type: AbilityType.Melee,
      power: 10,
    };

    const damage = combatSystem.calculateDamage(attacker, ability, target);
    expect(damage).toBeGreaterThan(0);
    // Warrior gets 10% bonus, so max damage is (power + level) * 1.1 * 1.1 (random factor)
    const maxDamage = Math.floor((ability.power + attacker.level) * 1.1 * 1.1);
    expect(damage).toBeLessThanOrEqual(maxDamage);
  });

  it('should apply damage to target', () => {
    const target: Entity = {
      id: 'target1',
      type: 'mob' as any,
      pos: { x: 1, y: 0, z: 0 },
      hp: 100,
      maxHp: 100,
      aiState: 'idle' as any,
    };

    const damage = 25;
    const events: CombatEvent[] = [];
    
    combatSystem.applyDamage(target, damage, events);
    
    expect(target.hp).toBe(75);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe(CombatEventType.Damage);
    expect(events[0].amount).toBe(25);
  });

  it('should handle target death', () => {
    const target: Entity = {
      id: 'target1',
      type: 'mob' as any,
      pos: { x: 1, y: 0, z: 0 },
      hp: 10,
      maxHp: 100,
      aiState: 'idle' as any,
    };

    const damage = 25;
    const events: CombatEvent[] = [];
    
    combatSystem.applyDamage(target, damage, events);
    
    expect(target.hp).toBe(0);
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe(CombatEventType.Damage);
    expect(events[1].type).toBe(CombatEventType.Death);
  });

  it('should consume resources on successful cast', () => {
    const player: Player = {
      id: 'player1',
      name: 'TestPlayer',
      class: CharacterClass.Mage,
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

    const ability: Ability = {
      id: 'Magic Bolt',
      class: CharacterClass.Mage,
      gcd: 1.0,
      cd: 0,
      cost: 10,
      range: 10,
      type: AbilityType.Projectile,
      power: 15,
    };

    const initialMp = player.mp;
    const result = combatSystem.tryCast(player, ability, null);
    
    expect(result.success).toBe(true);
    expect(player.mp).toBe(initialMp - ability.cost);
  });
});
