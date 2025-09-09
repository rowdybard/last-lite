import { BaseRoom } from './base-room.js';
import { Player, CharacterClass, Zone, ZoneType } from '../shared/types';

export class HubRoom extends BaseRoom {
  protected createPlayer(sessionId: string, options: any): Player {
    return {
      id: sessionId,
      name: options.name || `Player_${sessionId.slice(0, 8)}`,
      class: options.class || CharacterClass.Warrior,
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
      debuffs: [],
      lastGcd: 0,
      abilityCooldowns: new Map(),
      inventory: [],
      lastActivity: Date.now(),
    };
  }

  protected initializeZones(): void {
    // Initialize Hub zone
    const hubZone: Zone = {
      id: 'world:hub',
      name: 'Hub',
      type: ZoneType.Hub,
      maxPlayers: 80,
      doors: [
        {
          id: 'hub-to-field-1',
          fromZone: 'world:hub',
          toZone: 'world:field:1',
          pos: { x: 10, y: 0, z: 0 },
        },
      ],
      spawnPoints: [
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: -2, y: 0, z: 0 },
      ],
    };

    // Initialize Field zone
    const fieldZone: Zone = {
      id: 'world:field:1',
      name: 'Field 1',
      type: ZoneType.Field,
      maxPlayers: 60,
      doors: [
        {
          id: 'field-1-to-hub',
          fromZone: 'world:field:1',
          toZone: 'world:hub',
          pos: { x: -10, y: 0, z: 0 },
        },
      ],
      spawnPoints: [
        { x: 0, y: 0, z: 0 },
        { x: 5, y: 0, z: 5 },
        { x: -5, y: 0, z: -5 },
      ],
    };

    this.zoneService.registerZone(hubZone);
    this.zoneService.registerZone(fieldZone);
  }
}
