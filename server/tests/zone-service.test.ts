import { describe, it, expect, beforeEach } from 'vitest';
import { ZoneService } from '../src/services/zone-service.js';
import { Door, Zone, ZoneType, Position } from '@shared/types';

describe('ZoneService', () => {
  let zoneService: ZoneService;
  let hubZone: Zone;
  let fieldZone: Zone;

  beforeEach(() => {
    zoneService = new ZoneService();
    
    // Create test zones
    hubZone = {
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
      ],
    };

    fieldZone = {
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
      ],
    };

    zoneService.registerZone(hubZone);
    zoneService.registerZone(fieldZone);
  });

  it('should validate door proximity correctly', () => {
    const playerPos: Position = { x: 10.5, y: 0, z: 0 }; // Near door
    const farPos: Position = { x: 20, y: 0, z: 0 }; // Far from door

    const nearDoor = zoneService.findNearestDoor('world:hub', playerPos, 2.0);
    const farDoor = zoneService.findNearestDoor('world:hub', farPos, 2.0);

    expect(nearDoor).toBeTruthy();
    expect(nearDoor?.id).toBe('hub-to-field-1');
    expect(farDoor).toBeNull();
  });

  it('should validate door requirements', () => {
    const door = hubZone.doors[0];
    const playerPos: Position = { x: 10.5, y: 0, z: 0 };

    // Door without requirements should be valid
    const result = zoneService.validateDoorAccess(door, playerPos, 2.0, []);
    expect(result.valid).toBe(true);

    // Door with quest requirement should be invalid without quest
    const doorWithReq = { ...door, reqQuestId: 'tutorial-1' };
    const resultWithReq = zoneService.validateDoorAccess(doorWithReq, playerPos, 2.0, []);
    expect(resultWithReq.valid).toBe(false);
    expect(resultWithReq.reason).toBe('Quest requirement not met');

    // Door with quest requirement should be valid with quest
    const resultWithQuest = zoneService.validateDoorAccess(doorWithReq, playerPos, 2.0, ['tutorial-1']);
    expect(resultWithQuest.valid).toBe(true);
  });

  it('should get target zone for door', () => {
    const door = hubZone.doors[0];
    const targetZone = zoneService.getTargetZone(door);
    
    expect(targetZone).toBeTruthy();
    expect(targetZone?.id).toBe('world:field:1');
  });

  it('should get random spawn point for zone', () => {
    const spawnPoint = zoneService.getRandomSpawnPoint('world:hub');
    
    expect(spawnPoint).toBeTruthy();
    expect(spawnPoint?.x).toBeDefined();
    expect(spawnPoint?.y).toBeDefined();
    expect(spawnPoint?.z).toBeDefined();
  });

  it('should handle zone not found gracefully', () => {
    const spawnPoint = zoneService.getRandomSpawnPoint('nonexistent-zone');
    expect(spawnPoint).toBeNull();
  });

  it('should validate zone capacity', () => {
    const canJoin = zoneService.canJoinZone('world:hub', 75);
    const cannotJoin = zoneService.canJoinZone('world:hub', 85);
    
    expect(canJoin).toBe(true);
    expect(cannotJoin).toBe(false);
  });
});
