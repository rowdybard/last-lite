import { Player, Entity, Ability, CombatEvent, CombatEventType, Position } from '@shared/types';

export interface CastResult {
  success: boolean;
  reason?: string;
  damage?: number;
}

export class CombatSystem {
  private now: () => number;

  constructor(now: () => number = () => Date.now()) {
    this.now = now;
  }

  tryCast(player: Player, ability: Ability, target: Entity | null): CastResult {
    const currentTime = this.now();

    // Check GCD
    if (currentTime - player.lastGcd < ability.gcd * 1000) {
      return { success: false, reason: 'GCD' };
    }

    // Check ability cooldown
    const lastCast = player.abilityCooldowns.get(ability.id);
    if (lastCast && currentTime - lastCast < ability.cd * 1000) {
      return { success: false, reason: 'Cooldown' };
    }

    // Check resource requirements
    if (player.mp < ability.cost) {
      return { success: false, reason: 'Insufficient resources' };
    }

    // Check range if target is provided
    if (target && !this.isInRange(player.pos, target.pos, ability.range)) {
      return { success: false, reason: 'Target out of range' };
    }

    // All checks passed, execute the cast
    this.executeCast(player, ability, target, currentTime);

    // Calculate damage if target exists
    const damage = target ? this.calculateDamage(player, ability, target) : 0;

    return { success: true, damage };
  }

  private executeCast(player: Player, ability: Ability, target: Entity | null, currentTime: number): void {
    // Update GCD
    player.lastGcd = currentTime;

    // Update ability cooldown
    player.abilityCooldowns.set(ability.id, currentTime);

    // Consume resources
    player.mp = Math.max(0, player.mp - ability.cost);
  }

  calculateDamage(attacker: Player, ability: Ability, target: Entity): number {
    // Base damage from ability power
    let damage = ability.power;

    // Add level scaling
    damage += attacker.level;

    // Add class-specific scaling
    switch (attacker.class) {
      case 'Warrior':
        damage *= 1.1; // Warriors do 10% more damage
        break;
      case 'Ranger':
        damage *= 1.0; // Rangers do base damage
        break;
      case 'Mage':
        damage *= 1.2; // Mages do 20% more damage
        break;
    }

    // Add some randomness (±10%)
    const randomFactor = 0.9 + Math.random() * 0.2;
    damage *= randomFactor;

    return Math.floor(damage);
  }

  applyDamage(target: Entity, damage: number, events: CombatEvent[]): void {
    const actualDamage = Math.min(damage, target.hp);
    target.hp = Math.max(0, target.hp - damage);

    // Add damage event
    events.push({
      at: this.now(),
      type: CombatEventType.Damage,
      srcId: 'system',
      dstId: target.id,
      amount: actualDamage,
    });

    // Add death event if target died
    if (target.hp <= 0) {
      events.push({
        at: this.now(),
        type: CombatEventType.Death,
        srcId: 'system',
        dstId: target.id,
      });
    }
  }

  private isInRange(pos1: Position, pos2: Position, range: number): boolean {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    return distance <= range;
  }

  processCombatEvents(events: CombatEvent[]): void {
    // In a real implementation, this would broadcast events to clients
    // For now, we'll just clear the events array
    events.length = 0;
  }
}
