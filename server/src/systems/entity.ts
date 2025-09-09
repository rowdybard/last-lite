import { Entity, AIState, Position, EntityType } from '../shared/types';

export interface EntitySpawnData {
  id: string;
  name: string;
  type: EntityType;
  pos: Position;
  level: number;
  hp: number;
  maxHp: number;
  spawnPos: Position;
  leashDistance?: number;
}

export class EntitySystem {
  private entities: Map<string, Entity> = new Map();

  spawnEntity(spawnData: EntitySpawnData): Entity {
    const entity: Entity = {
      id: spawnData.id,
      name: spawnData.name,
      type: spawnData.type,
      pos: { ...spawnData.pos },
      vel: { vx: 0, vz: 0 },
      dir: 0,
      anim: 'idle',
      hp: spawnData.hp,
      maxHp: spawnData.maxHp,
      level: spawnData.level,
      aiState: { current: 'idle', lastUpdate: Date.now() },
      spawnPos: { ...spawnData.spawnPos },
      leashDistance: spawnData.leashDistance || 10,
    };

    this.entities.set(entity.id, entity);
    return entity;
  }

  getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  removeEntity(id: string): boolean {
    return this.entities.delete(id);
  }

  findEntitiesByName(name: string): Entity[] {
    const results: Entity[] = [];
    for (const entity of this.entities.values()) {
      if (entity.name.toLowerCase() === name.toLowerCase()) {
        results.push(entity);
      }
    }
    return results;
  }

  findNearestEntity(position: Position, name?: string): Entity | null {
    let nearest: Entity | null = null;
    let nearestDistance = Infinity;

    for (const entity of this.entities.values()) {
      // Filter by name if specified
      if (name && entity.name.toLowerCase() !== name.toLowerCase()) {
        continue;
      }

      const distance = this.calculateDistance(position, entity.pos);
      if (distance < nearestDistance) {
        nearest = entity;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  getAllEntities(): Map<string, Entity> {
    return new Map(this.entities);
  }

  updateEntity(id: string, updates: Partial<Entity>): boolean {
    const entity = this.entities.get(id);
    if (!entity) {
      return false;
    }

    // Apply updates
    Object.assign(entity, updates);
    return true;
  }

  getEntitiesInRange(position: Position, range: number): Entity[] {
    const results: Entity[] = [];
    
    for (const entity of this.entities.values()) {
      const distance = this.calculateDistance(position, entity.pos);
      if (distance <= range) {
        results.push(entity);
      }
    }

    return results;
  }

  getEntitiesByType(type: 'mob' | 'npc' | 'item'): Entity[] {
    const results: Entity[] = [];
    
    for (const entity of this.entities.values()) {
      if (entity.type === type) {
        results.push(entity);
      }
    }

    return results;
  }

  respawnEntity(id: string): boolean {
    const entity = this.entities.get(id);
    if (!entity) {
      return false;
    }

    // Reset entity to spawn state
    entity.pos = { ...entity.spawnPos! };
    entity.vel = { vx: 0, vz: 0 };
    entity.dir = 0;
    entity.anim = 'idle';
    entity.hp = entity.maxHp;
    entity.aiState = { current: 'idle', lastUpdate: Date.now() };

    return true;
  }

  private calculateDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
}
