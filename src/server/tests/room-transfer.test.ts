import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoomTransferService } from '../src/services/room-transfer-service.js';
import { ZoneService } from '../src/services/zone-service.js';
import { Player, CharacterClass, Position } from '@shared/types';

describe('RoomTransferService', () => {
  let transferService: RoomTransferService;
  let zoneService: ZoneService;
  let mockClient: any;

  beforeEach(() => {
    zoneService = new ZoneService();
    transferService = new RoomTransferService(zoneService);
    
    // Register test zones
    const hubZone = {
      id: 'world:hub',
      name: 'Hub',
      type: 'hub' as any,
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
      ],
    };

    const fieldZone = {
      id: 'world:field:1',
      name: 'Field 1',
      type: 'field' as any,
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
      ],
    };

    zoneService.registerZone(hubZone);
    zoneService.registerZone(fieldZone);
    
    mockClient = {
      sessionId: 'test-session-1',
      send: vi.fn(),
      leave: vi.fn(),
    };
  });

  it('should validate zone transfer request', () => {
    const player: Player = {
      id: 'test-session-1',
      name: 'TestPlayer',
      class: CharacterClass.Warrior,
      level: 1,
      xp: 0,
      pos: { x: 10.5, y: 0, z: 0 }, // Near door
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

    const result = transferService.validateTransferRequest('world:hub', 'world:field:1', player, 2.0, []);
    
    expect(result.valid).toBe(true);
    expect(result.targetZone).toBe('world:field:1');
  });

  it('should reject transfer when too far from door', () => {
    const player: Player = {
      id: 'test-session-1',
      name: 'TestPlayer',
      class: CharacterClass.Warrior,
      level: 1,
      xp: 0,
      pos: { x: 20, y: 0, z: 0 }, // Far from door
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

    const result = transferService.validateTransferRequest('world:hub', 'world:field:1', player, 2.0, []);
    
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Too far from door');
  });

  it('should reject transfer when quest requirement not met', () => {
    const player: Player = {
      id: 'test-session-1',
      name: 'TestPlayer',
      class: CharacterClass.Warrior,
      level: 1,
      xp: 0,
      pos: { x: 10.5, y: 0, z: 0 },
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

    // Mock a door with quest requirement
    const mockDoor = {
      id: 'hub-to-field-1',
      fromZone: 'world:hub',
      toZone: 'world:field:1',
      pos: { x: 10, y: 0, z: 0 },
      reqQuestId: 'tutorial-1',
    };

    vi.spyOn(zoneService, 'findNearestDoor').mockReturnValue(mockDoor as any);
    vi.spyOn(zoneService, 'validateDoorAccess').mockReturnValue({
      valid: false,
      reason: 'Quest requirement not met',
    });

    const result = transferService.validateTransferRequest('world:hub', 'world:field:1', player, 2.0, []);
    
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Quest requirement not met');
  });

  it('should create transfer payload with player data', () => {
    const player: Player = {
      id: 'test-session-1',
      name: 'TestPlayer',
      class: CharacterClass.Warrior,
      level: 5,
      xp: 1000,
      pos: { x: 10.5, y: 0, z: 0 },
      vel: { vx: 1, vz: 0 },
      dir: 1.5,
      anim: 'walk',
      hp: 80,
      maxHp: 100,
      mp: 30,
      maxMp: 50,
      gold: 500,
      buffs: [],
      lastGcd: 1000,
      abilityCooldowns: new Map([['Slash', 2000]]),
    };

    const payload = transferService.createTransferPayload(player, { x: 0, y: 0, z: 0 });
    
    expect(payload.name).toBe('TestPlayer');
    expect(payload.class).toBe(CharacterClass.Warrior);
    expect(payload.level).toBe(5);
    expect(payload.xp).toBe(1000);
    expect(payload.hp).toBe(80);
    expect(payload.mp).toBe(30);
    expect(payload.gold).toBe(500);
    expect(payload.spawnPos).toEqual({ x: 0, y: 0, z: 0 });
  });
});
