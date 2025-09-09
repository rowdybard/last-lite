import { BaseRoom } from './base-room.js';
import { Player, CharacterClass, EntityType } from '../shared/types';

export class FieldRoom extends BaseRoom {
  protected createPlayer(sessionId: string, options: any): Player {
    return {
      id: sessionId,
      name: options.name || `Player_${sessionId.slice(0, 8)}`,
      class: options.class || CharacterClass.Warrior,
      level: 1,
      xp: 0,
      pos: options.spawnPos || { x: 0, y: 0, z: 0 },
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
      abilityCooldowns: {},
      inventory: [],
      lastActivity: Date.now(),
    };
  }

  protected initializeZones(): void {
    // Spawn some mobs in the field
    this.spawnFieldMobs();
  }

  private spawnFieldMobs(): void {
    // Spawn Boarlings
    this.entitySystem.spawnEntity({
      id: 'boarling-1',
      name: 'Boarling',
      type: EntityType.Mob,
      pos: { x: 5, y: 0, z: 5 },
      level: 2,
      hp: 60,
      maxHp: 60,
      spawnPos: { x: 5, y: 0, z: 5 },
      leashDistance: 8
    });

    this.entitySystem.spawnEntity({
      id: 'boarling-2',
      name: 'Boarling',
      type: EntityType.Mob,
      pos: { x: -3, y: 0, z: 7 },
      level: 2,
      hp: 60,
      maxHp: 60,
      spawnPos: { x: -3, y: 0, z: 7 },
      leashDistance: 8
    });

    // Spawn Goblins
    this.entitySystem.spawnEntity({
      id: 'goblin-1',
      name: 'Goblin',
      type: EntityType.Mob,
      pos: { x: 8, y: 0, z: -2 },
      level: 1,
      hp: 40,
      maxHp: 40,
      spawnPos: { x: 8, y: 0, z: -2 },
      leashDistance: 6
    });

    this.entitySystem.spawnEntity({
      id: 'goblin-2',
      name: 'Goblin',
      type: EntityType.Mob,
      pos: { x: -6, y: 0, z: -4 },
      level: 1,
      hp: 40,
      maxHp: 40,
      spawnPos: { x: -6, y: 0, z: -4 },
      leashDistance: 6
    });
  }
}
