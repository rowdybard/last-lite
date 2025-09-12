import { Entity, Player, Drop, Rarity, RarityEnum } from '../shared/types.js';

export interface LootDrop {
  id: string;
  itemId: string;
  quantity: number;
  rarity: Rarity;
  level: number;
  pos: { x: number; y: number; z: number };
  ownerId: string;
  createdAt: number;
  ttl: number;
}

export class LootSystem {
  private readonly DROP_RATES = {
    [RarityEnum.common]: 0.7,    // 70% chance
    [RarityEnum.uncommon]: 0.2,  // 20% chance
    [RarityEnum.rare]: 0.08,     // 8% chance
    [RarityEnum.epic]: 0.02,     // 2% chance
  };

  private readonly GOLD_PER_LEVEL = 5;
  private readonly MAX_GOLD_MULTIPLIER = 2;

  generateLoot(entity: Entity, player: Player): LootDrop[] {
    const drops: LootDrop[] = [];
    
    // Always generate gold
    const goldAmount = this.generateGoldAmount(entity, player);
    if (goldAmount > 0) {
      drops.push({
        id: `drop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        itemId: 'gold',
        quantity: goldAmount,
        rarity: RarityEnum.common,
        level: 1,
        pos: { ...entity.pos },
        ownerId: player.id,
        createdAt: Date.now(),
        ttl: 300000, // 5 minutes
      });
    }

    // Generate item drops based on entity level and type
    const itemDrops = this.generateItemDrops(entity, player);
    drops.push(...itemDrops);

    return drops;
  }

  private generateGoldAmount(entity: Entity, player: Player): number {
    const baseGold = entity.level * this.GOLD_PER_LEVEL;
    const randomMultiplier = 1 + Math.random() * this.MAX_GOLD_MULTIPLIER;
    return Math.floor(baseGold * randomMultiplier);
  }

  private generateItemDrops(entity: Entity, player: Player): LootDrop[] {
    const drops: LootDrop[] = [];
    
    // Determine number of item drops (0-2 items)
    const numDrops = Math.random() < 0.3 ? 1 : (Math.random() < 0.1 ? 2 : 0);
    
    for (let i = 0; i < numDrops; i++) {
      const rarity = this.rollRarity();
      const item = this.generateItem(entity, player, rarity);
      
      if (item) {
        drops.push({
          id: `drop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          itemId: item.id,
          quantity: item.quantity,
          rarity: item.rarity,
          level: item.level,
          pos: { ...entity.pos },
          ownerId: player.id,
          createdAt: Date.now(),
          ttl: this.getDropTTL(item.rarity),
        });
      }
    }

    return drops;
  }

  private rollRarity(): Rarity {
    const roll = Math.random();
    let cumulative = 0;

    for (const [rarity, rate] of Object.entries(this.DROP_RATES)) {
      cumulative += rate;
      if (roll <= cumulative) {
        return rarity as Rarity;
      }
    }

    return RarityEnum.common; // Fallback
  }

  private generateItem(entity: Entity, player: Player, rarity: Rarity): any {
    // Simple item generation based on entity type and level
    const itemLevel = Math.max(1, entity.level - 1 + Math.floor(Math.random() * 3));
    
    const itemTemplates = {
      [RarityEnum.common]: [
        { id: 'health_potion', quantity: 1, level: itemLevel },
        { id: 'mana_potion', quantity: 1, level: itemLevel },
        { id: 'iron_sword', quantity: 1, level: itemLevel },
      ],
      [RarityEnum.uncommon]: [
        { id: 'steel_sword', quantity: 1, level: itemLevel },
        { id: 'leather_armor', quantity: 1, level: itemLevel },
        { id: 'magic_ring', quantity: 1, level: itemLevel },
      ],
      [RarityEnum.rare]: [
        { id: 'enchanted_sword', quantity: 1, level: itemLevel },
        { id: 'chain_mail', quantity: 1, level: itemLevel },
        { id: 'power_amulet', quantity: 1, level: itemLevel },
      ],
      [RarityEnum.epic]: [
        { id: 'legendary_blade', quantity: 1, level: itemLevel },
        { id: 'dragon_scale_armor', quantity: 1, level: itemLevel },
        { id: 'crown_of_power', quantity: 1, level: itemLevel },
      ],
    };

    const templates = itemTemplates[rarity];
    if (templates && templates.length > 0) {
      const template = templates[Math.floor(Math.random() * templates.length)];
      return {
        ...template,
        rarity,
      };
    }

    return null;
  }

  private getDropTTL(rarity: Rarity): number {
    // Higher rarity items last longer
    const ttlMap = {
      [RarityEnum.common]: 300000,    // 5 minutes
      [RarityEnum.uncommon]: 600000,  // 10 minutes
      [RarityEnum.rare]: 1200000,     // 20 minutes
      [RarityEnum.epic]: 1800000,     // 30 minutes
    };

    return ttlMap[rarity] || 300000;
  }

  isDropExpired(drop: LootDrop): boolean {
    return Date.now() - drop.createdAt > drop.ttl;
  }

  getExpiredDrops(drops: LootDrop[]): LootDrop[] {
    return drops.filter(drop => this.isDropExpired(drop));
  }

  getValidDrops(drops: LootDrop[]): LootDrop[] {
    return drops.filter(drop => !this.isDropExpired(drop));
  }
}
