import { describe, it, expect } from 'vitest';
import { MovementSystem } from '../src/systems/movement.js';
import { Player } from '@shared/types';

describe('MovementSystem', () => {
  it('should clamp speed and world bounds', () => {
    const system = new MovementSystem({ bound: 20, maxSpeed: 4 });
    const player: Player = {
      id: 'test-player',
      name: 'TestPlayer',
      class: 'Warrior' as any,
      level: 1,
      xp: 0,
      pos: { x: 19.9, y: 0, z: 0 },
      vel: { vx: 10, vz: 0 },
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

    system.step(0.016, player);

    expect(player.pos.x).toBeLessThanOrEqual(20);
    expect(Math.hypot(player.vel.vx, player.vel.vz)).toBeLessThanOrEqual(4);
  });

  it('should apply friction to velocity', () => {
    const system = new MovementSystem({ bound: 20, maxSpeed: 4, friction: 0.9 });
    const player: Player = {
      id: 'test-player',
      name: 'TestPlayer',
      class: 'Warrior' as any,
      level: 1,
      xp: 0,
      pos: { x: 0, y: 0, z: 0 },
      vel: { vx: 2, vz: 2 },
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

    const initialSpeed = Math.hypot(player.vel.vx, player.vel.vz);
    system.step(0.016, player);
    const finalSpeed = Math.hypot(player.vel.vx, player.vel.vz);

    expect(finalSpeed).toBeLessThan(initialSpeed);
  });

  it('should update position based on velocity', () => {
    const system = new MovementSystem({ bound: 20, maxSpeed: 4 });
    const player: Player = {
      id: 'test-player',
      name: 'TestPlayer',
      class: 'Warrior' as any,
      level: 1,
      xp: 0,
      pos: { x: 0, y: 0, z: 0 },
      vel: { vx: 1, vz: 1 },
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

    const initialX = player.pos.x;
    const initialZ = player.pos.z;

    system.step(0.016, player);

    expect(player.pos.x).toBeGreaterThan(initialX);
    expect(player.pos.z).toBeGreaterThan(initialZ);
  });
});
