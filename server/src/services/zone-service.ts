import { Zone, Door, Position, ZoneType } from '@shared/types';

export interface DoorValidationResult {
  valid: boolean;
  reason?: string;
}

export class ZoneService {
  private zones: Map<string, Zone> = new Map();

  registerZone(zone: Zone): void {
    this.zones.set(zone.id, zone);
  }

  getZone(zoneId: string): Zone | null {
    return this.zones.get(zoneId) || null;
  }

  findNearestDoor(zoneId: string, playerPos: Position, maxDistance: number): Door | null {
    const zone = this.getZone(zoneId);
    if (!zone) return null;

    let nearestDoor: Door | null = null;
    let nearestDistance = maxDistance;

    for (const door of zone.doors) {
      const distance = this.calculateDistance(playerPos, door.pos);
      if (distance <= nearestDistance) {
        nearestDoor = door;
        nearestDistance = distance;
      }
    }

    return nearestDoor;
  }

  validateDoorAccess(door: Door, playerPos: Position, maxDistance: number, completedQuests: string[]): DoorValidationResult {
    // Check proximity
    const distance = this.calculateDistance(playerPos, door.pos);
    if (distance > maxDistance) {
      return { valid: false, reason: 'Too far from door' };
    }

    // Check quest requirements
    if (door.reqQuestId && !completedQuests.includes(door.reqQuestId)) {
      return { valid: false, reason: 'Quest requirement not met' };
    }

    return { valid: true };
  }

  getTargetZone(door: Door): Zone | null {
    return this.getZone(door.toZone);
  }

  getRandomSpawnPoint(zoneId: string): Position | null {
    const zone = this.getZone(zoneId);
    if (!zone || zone.spawnPoints.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * zone.spawnPoints.length);
    return { ...zone.spawnPoints[randomIndex] };
  }

  canJoinZone(zoneId: string, currentPlayerCount: number): boolean {
    const zone = this.getZone(zoneId);
    if (!zone) return false;

    return currentPlayerCount < zone.maxPlayers;
  }

  private calculateDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
}
