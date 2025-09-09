import { BaseRoom } from './base-room.js';
import { Player, CharacterClass } from '../shared/types';

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
      lastGcd: 0,
      abilityCooldowns: new Map(),
    };
  }
}
