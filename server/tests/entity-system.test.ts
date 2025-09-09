import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntitySystem } from '../src/systems/entity';
import { Entity, AIState, CharacterClass } from '../shared/types';

describe('EntitySystem', () => {
  let entitySystem: EntitySystem;
  let mockEntities: Map<string, Entity>;

  beforeEach(() => {
    entitySystem = new EntitySystem();
    mockEntities = new Map();
  });

  it('should spawn a new entity with correct properties', () => {
    const spawnData = {
      id: 'boarling-1',
      name: 'Boarling',
      type: 'mob',
      pos: { x: 5, y: 0, z: 5 },
      level: 2,
      hp: 60,
      maxHp: 60,
      spawnPos: { x: 5, y: 0, z: 5 },
      leashDistance: 8
    };

    const entity = entitySystem.spawnEntity(spawnData);
    
    expect(entity).toBeDefined();
    expect(entity.id).toBe('boarling-1');
    expect(entity.name).toBe('Boarling');
    expect(entity.type).toBe('mob');
    expect(entity.pos).toEqual({ x: 5, y: 0, z: 5 });
    expect(entity.level).toBe(2);
    expect(entity.hp).toBe(60);
    expect(entity.maxHp).toBe(60);
    expect(entity.aiState).toBe(AIState.Idle);
    expect(entity.spawnPos).toEqual({ x: 5, y: 0, z: 5 });
    expect(entity.leashDistance).toBe(8);
  });

  it('should add spawned entity to the entities map', () => {
    const spawnData = {
      id: 'goblin-1',
      name: 'Goblin',
      type: 'mob',
      pos: { x: 0, y: 0, z: 0 },
      level: 1,
      hp: 40,
      maxHp: 40,
      spawnPos: { x: 0, y: 0, z: 0 },
      leashDistance: 6
    };

    entitySystem.spawnEntity(spawnData);
    
    const entity = entitySystem.getEntity('goblin-1');
    expect(entity).toBeDefined();
    expect(entity?.name).toBe('Goblin');
  });

  it('should remove entity when it dies', () => {
    const spawnData = {
      id: 'skeleton-1',
      name: 'Skeleton',
      type: 'mob',
      pos: { x: 0, y: 0, z: 0 },
      level: 3,
      hp: 80,
      maxHp: 80,
      spawnPos: { x: 0, y: 0, z: 0 },
      leashDistance: 10
    };

    const entity = entitySystem.spawnEntity(spawnData);
    expect(entitySystem.getEntity('skeleton-1')).toBeDefined();

    // Simulate entity death
    entity.hp = 0;
    entitySystem.removeEntity('skeleton-1');
    
    expect(entitySystem.getEntity('skeleton-1')).toBeUndefined();
  });

  it('should find entities by name', () => {
    entitySystem.spawnEntity({
      id: 'boarling-1',
      name: 'Boarling',
      type: 'mob',
      pos: { x: 0, y: 0, z: 0 },
      level: 1,
      hp: 50,
      maxHp: 50,
      spawnPos: { x: 0, y: 0, z: 0 },
      leashDistance: 8
    });

    entitySystem.spawnEntity({
      id: 'boarling-2',
      name: 'Boarling',
      type: 'mob',
      pos: { x: 2, y: 0, z: 2 },
      level: 1,
      hp: 50,
      maxHp: 50,
      spawnPos: { x: 2, y: 0, z: 2 },
      leashDistance: 8
    });

    const entities = entitySystem.findEntitiesByName('Boarling');
    expect(entities).toHaveLength(2);
    expect(entities[0].name).toBe('Boarling');
    expect(entities[1].name).toBe('Boarling');
  });

  it('should find nearest entity to a position', () => {
    entitySystem.spawnEntity({
      id: 'goblin-1',
      name: 'Goblin',
      type: 'mob',
      pos: { x: 5, y: 0, z: 5 },
      level: 1,
      hp: 40,
      maxHp: 40,
      spawnPos: { x: 5, y: 0, z: 5 },
      leashDistance: 6
    });

    entitySystem.spawnEntity({
      id: 'goblin-2',
      name: 'Goblin',
      type: 'mob',
      pos: { x: 10, y: 0, z: 10 },
      level: 1,
      hp: 40,
      maxHp: 40,
      spawnPos: { x: 10, y: 0, z: 10 },
      leashDistance: 6
    });

    const nearest = entitySystem.findNearestEntity({ x: 0, y: 0, z: 0 }, 'Goblin');
    expect(nearest).toBeDefined();
    expect(nearest?.id).toBe('goblin-1'); // Closer to origin
  });

  it('should update entity positions and states', () => {
    const entity = entitySystem.spawnEntity({
      id: 'wolf-1',
      name: 'Wolf',
      type: 'mob',
      pos: { x: 0, y: 0, z: 0 },
      level: 2,
      hp: 70,
      maxHp: 70,
      spawnPos: { x: 0, y: 0, z: 0 },
      leashDistance: 12
    });

    // Update entity position
    entity.pos = { x: 3, y: 0, z: 4 };
    entity.aiState = AIState.Chase;
    entity.anim = 'run';

    const updatedEntity = entitySystem.getEntity('wolf-1');
    expect(updatedEntity?.pos).toEqual({ x: 3, y: 0, z: 4 });
    expect(updatedEntity?.aiState).toBe(AIState.Chase);
    expect(updatedEntity?.anim).toBe('run');
  });

  it('should handle entity respawning', () => {
    const spawnData = {
      id: 'orc-1',
      name: 'Orc',
      type: 'mob',
      pos: { x: 0, y: 0, z: 0 },
      level: 4,
      hp: 100,
      maxHp: 100,
      spawnPos: { x: 0, y: 0, z: 0 },
      leashDistance: 15
    };

    const entity = entitySystem.spawnEntity(spawnData);
    
    // Simulate death
    entity.hp = 0;
    entitySystem.removeEntity('orc-1');
    
    // Respawn after delay
    setTimeout(() => {
      const respawnedEntity = entitySystem.spawnEntity(spawnData);
      expect(respawnedEntity.hp).toBe(100);
      expect(respawnedEntity.pos).toEqual({ x: 0, y: 0, z: 0 });
      expect(respawnedEntity.aiState).toBe(AIState.Idle);
    }, 100);
  });

  it('should get all entities in a room', () => {
    entitySystem.spawnEntity({
      id: 'mob-1',
      name: 'Mob1',
      type: 'mob',
      pos: { x: 0, y: 0, z: 0 },
      level: 1,
      hp: 50,
      maxHp: 50,
      spawnPos: { x: 0, y: 0, z: 0 },
      leashDistance: 8
    });

    entitySystem.spawnEntity({
      id: 'mob-2',
      name: 'Mob2',
      type: 'mob',
      pos: { x: 1, y: 0, z: 1 },
      level: 1,
      hp: 50,
      maxHp: 50,
      spawnPos: { x: 1, y: 0, z: 1 },
      leashDistance: 8
    });

    const allEntities = entitySystem.getAllEntities();
    expect(allEntities.size).toBe(2);
    expect(allEntities.has('mob-1')).toBe(true);
    expect(allEntities.has('mob-2')).toBe(true);
  });
});
