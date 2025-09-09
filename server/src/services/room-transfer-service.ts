import { ZoneService } from './zone-service.js';

import { Player, Position } from '../shared/types';

export interface TransferValidationResult {
  valid: boolean;
  reason?: string;
  targetZone?: string;
}

export interface TransferPayload {
  name: string;
  class: string;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  gold: number;
  spawnPos: Position;
  buffs: any[];
  lastGcd: number;
  abilityCooldowns: Record<string, number>;
}

export class RoomTransferService {
  private zoneService: ZoneService;

  constructor(zoneService: ZoneService) {
    this.zoneService = zoneService;
  }

  validateTransferRequest(
    currentZoneId: string,
    targetZoneId: string,
    player: Player,
    maxDoorDistance: number,
    completedQuests: string[]
  ): TransferValidationResult {
    // Find nearest door to target zone
    const door = this.zoneService.findNearestDoor(currentZoneId, player.pos, maxDoorDistance);
    if (!door) {
      return { valid: false, reason: 'Too far from door' };
    }

    // Validate door access
    const doorValidation = this.zoneService.validateDoorAccess(door, player.pos, maxDoorDistance, completedQuests);
    if (!doorValidation.valid) {
      return { valid: false, reason: doorValidation.reason };
    }

    // Check if target zone exists
    const targetZone = this.zoneService.getTargetZone(door);
    if (!targetZone) {
      return { valid: false, reason: 'Target zone not found' };
    }

    // Check zone capacity (this would need current player count in real implementation)
    // For now, we'll assume zones can handle the transfer

    return { valid: true, targetZone: targetZoneId };
  }

  createTransferPayload(player: Player, spawnPos: Position): TransferPayload {
    return {
      name: player.name,
      class: player.class,
      level: player.level,
      xp: player.xp,
      hp: player.hp,
      maxHp: player.maxHp,
      mp: player.mp,
      maxMp: player.maxMp,
      gold: player.gold,
      spawnPos,
      buffs: [...player.buffs],
      lastGcd: player.lastGcd,
      abilityCooldowns: { ...player.abilityCooldowns },
    };
  }

  getSpawnPositionForZone(zoneId: string): Position | null {
    return this.zoneService.getRandomSpawnPoint(zoneId);
  }
}
