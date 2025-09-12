import { Entity, AIState, Player, Position } from '../shared/types';

export class AISystem {
  private readonly AGGRO_RADIUS = 8.0;
  private readonly MELEE_RANGE = 2.0;
  private readonly MOVE_SPEED = 3.0;

  update(entities: Map<string, Entity>, players: Map<string, Player>, deltaTime: number): void {
    entities.forEach((entity) => {
      if (entity.type === 'mob') {
        this.updateMobAI(entity, players, deltaTime);
      }
    });
  }

  private updateMobAI(entity: Entity, players: Map<string, Player>, deltaTime: number): void {
    const nearestPlayer = this.findNearestPlayer(entity, players);
    
    if (!nearestPlayer) {
      this.handleNoPlayers(entity, deltaTime);
      return;
    }

    const distanceToPlayer = this.calculateDistance(entity.pos, nearestPlayer.pos);
    const distanceToSpawn = entity.spawnPos ? 
      this.calculateDistance(entity.pos, entity.spawnPos) : 0;

    // Check leash distance
    if (entity.leashDistance && distanceToSpawn > entity.leashDistance) {
      this.handleLeash(entity, deltaTime);
      return;
    }

    // State machine
    const currentState = typeof entity.aiState === 'string' ? entity.aiState : entity.aiState.current;
    switch (currentState) {
      case 'idle':
        this.handleIdle(entity, nearestPlayer, distanceToPlayer);
        break;
      case 'alert':
        this.handleAlert(entity, nearestPlayer, distanceToPlayer);
        break;
      case 'chase':
        this.handleChase(entity, nearestPlayer, distanceToPlayer, deltaTime);
        break;
      case 'attack':
        this.handleAttack(entity, nearestPlayer, distanceToPlayer);
        break;
      case 'reset':
        this.handleReset(entity, deltaTime);
        break;
    }
  }

  private findNearestPlayer(entity: Entity, players: Map<string, Player>): Player | null {
    let nearestPlayer: Player | null = null;
    let nearestDistance = Infinity;

    players.forEach((player) => {
      if (player.hp <= 0) return; // Skip dead players
      
      const distance = this.calculateDistance(entity.pos, player.pos);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPlayer = player;
      }
    });

    return nearestPlayer;
  }

  private handleIdle(entity: Entity, player: Player, distance: number): void {
    if (distance <= this.AGGRO_RADIUS) {
      entity.aiState = { current: 'alert', lastUpdate: Date.now() } as AIState;
    }
  }

  private handleAlert(entity: Entity, player: Player, distance: number): void {
    if (distance > this.AGGRO_RADIUS) {
      entity.aiState = { current: 'idle', lastUpdate: Date.now() } as AIState;
    } else if (distance <= this.MELEE_RANGE) {
      entity.aiState = { current: 'attack', lastUpdate: Date.now() } as AIState;
    } else {
      entity.aiState = { current: 'chase', lastUpdate: Date.now() } as AIState;
    }
  }

  private handleChase(entity: Entity, player: Player, distance: number, deltaTime: number): void {
    // Check leash distance first
    if (entity.leashDistance && entity.spawnPos) {
      const distanceToSpawn = this.calculateDistance(entity.pos, entity.spawnPos);
      if (distanceToSpawn > entity.leashDistance) {
        entity.aiState = { current: 'reset', lastUpdate: Date.now() } as AIState;
        return;
      }
    }

    if (distance > this.AGGRO_RADIUS) {
      entity.aiState = { current: 'idle', lastUpdate: Date.now() } as AIState;
    } else if (distance <= this.MELEE_RANGE) {
      entity.aiState = { current: 'attack', lastUpdate: Date.now() } as AIState;
    } else {
      // Move towards player
      this.moveTowards(entity, player.pos, deltaTime);
    }
  }

  private handleAttack(entity: Entity, player: Player, distance: number): void {
    if (distance > this.MELEE_RANGE) {
      entity.aiState = { current: 'chase', lastUpdate: Date.now() } as AIState;
    }
    // In a real implementation, this would trigger attack animations and damage
  }

  private handleReset(entity: Entity, deltaTime: number): void {
    if (!entity.spawnPos) {
      entity.aiState = { current: 'idle', lastUpdate: Date.now() } as AIState;
      return;
    }

    const distanceToSpawn = this.calculateDistance(entity.pos, entity.spawnPos);
    
    if (distanceToSpawn < 0.5) {
      // Reached spawn, reset HP and go to idle
      entity.hp = entity.maxHp;
      entity.aiState = { current: 'idle', lastUpdate: Date.now() } as AIState;
    } else {
      // Move towards spawn
      this.moveTowards(entity, entity.spawnPos, deltaTime);
    }
  }

  private handleLeash(entity: Entity, deltaTime: number): void {
    entity.aiState = { current: 'reset', lastUpdate: Date.now() } as AIState;
    this.handleReset(entity, deltaTime);
  }

  private handleNoPlayers(entity: Entity, deltaTime: number): void {
    const currentState = typeof entity.aiState === 'string' ? entity.aiState : entity.aiState.current;
    if (currentState !== 'idle' && entity.spawnPos) {
      entity.aiState = { current: 'reset', lastUpdate: Date.now() } as AIState;
      this.handleReset(entity, deltaTime);
    }
  }

  private moveTowards(entity: Entity, targetPos: Position, deltaTime: number): void {
    const dx = targetPos.x - entity.pos.x;
    const dz = targetPos.z - entity.pos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > 0.1) {
      const moveDistance = this.MOVE_SPEED * deltaTime;
      const moveRatio = Math.min(moveDistance / distance, 1.0);

      entity.pos.x += dx * moveRatio;
      entity.pos.z += dz * moveRatio;
    }
  }

  private calculateDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
}
