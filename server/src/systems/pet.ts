import { Player, Position, Velocity } from '../shared/types';

export enum PetType {
  Wolf = 'wolf',
  Cat = 'cat',
  Bird = 'bird',
  Dragon = 'dragon'
}

export enum PetRarity {
  Common = 'common',
  Uncommon = 'uncommon',
  Rare = 'rare',
  Epic = 'epic'
}

export interface Pet {
  id: string;
  name: string;
  type: PetType;
  rarity: PetRarity;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  pos: Position;
  vel: Velocity;
  dir: number;
  anim: string;
  ownerId: string;
  summoned: boolean;
  lastActivity: number;
  abilities: PetAbility[];
}

export interface PetAbility {
  id: string;
  name: string;
  description: string;
  type: 'attack' | 'heal' | 'buff' | 'debuff';
  damage?: number;
  healing?: number;
  cooldown: number;
  lastUsed: number;
  manaCost: number;
}

export interface PetTemplate {
  type: PetType;
  rarity: PetRarity;
  baseStats: {
    hp: number;
    mp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  abilities: PetAbility[];
}

export class PetSystem {
  private pets: Map<string, Pet> = new Map(); // petId -> Pet
  private playerPets: Map<string, string[]> = new Map(); // playerId -> petIds
  private petTemplates: Map<string, PetTemplate> = new Map();

  constructor() {
    this.initializePetTemplates();
  }

  private initializePetTemplates(): void {
    // Wolf Template
    const wolfTemplate: PetTemplate = {
      type: PetType.Wolf,
      rarity: PetRarity.Common,
      baseStats: {
        hp: 80,
        mp: 30,
        attack: 25,
        defense: 15,
        speed: 20
      },
      abilities: [
        {
          id: 'wolf_bite',
          name: 'Bite',
          description: 'A powerful bite attack',
          type: 'attack',
          damage: 30,
          cooldown: 3000,
          lastUsed: 0,
          manaCost: 10
        },
        {
          id: 'wolf_howl',
          name: 'Howl',
          description: 'Increases attack power',
          type: 'buff',
          cooldown: 10000,
          lastUsed: 0,
          manaCost: 15
        }
      ]
    };

    // Cat Template
    const catTemplate: PetTemplate = {
      type: PetType.Cat,
      rarity: PetRarity.Common,
      baseStats: {
        hp: 60,
        mp: 50,
        attack: 20,
        defense: 10,
        speed: 30
      },
      abilities: [
        {
          id: 'cat_scratch',
          name: 'Scratch',
          description: 'Quick claw attack',
          type: 'attack',
          damage: 20,
          cooldown: 2000,
          lastUsed: 0,
          manaCost: 5
        },
        {
          id: 'cat_heal',
          name: 'Purr',
          description: 'Heals the owner',
          type: 'heal',
          healing: 25,
          cooldown: 8000,
          lastUsed: 0,
          manaCost: 20
        }
      ]
    };

    // Bird Template
    const birdTemplate: PetTemplate = {
      type: PetType.Bird,
      rarity: PetRarity.Uncommon,
      baseStats: {
        hp: 50,
        mp: 70,
        attack: 15,
        defense: 8,
        speed: 35
      },
      abilities: [
        {
          id: 'bird_peck',
          name: 'Peck',
          description: 'Precise beak attack',
          type: 'attack',
          damage: 18,
          cooldown: 1500,
          lastUsed: 0,
          manaCost: 8
        },
        {
          id: 'bird_fly',
          name: 'Fly',
          description: 'Increases movement speed',
          type: 'buff',
          cooldown: 12000,
          lastUsed: 0,
          manaCost: 25
        }
      ]
    };

    // Dragon Template
    const dragonTemplate: PetTemplate = {
      type: PetType.Dragon,
      rarity: PetRarity.Epic,
      baseStats: {
        hp: 150,
        mp: 100,
        attack: 50,
        defense: 30,
        speed: 15
      },
      abilities: [
        {
          id: 'dragon_breath',
          name: 'Fire Breath',
          description: 'Devastating fire attack',
          type: 'attack',
          damage: 60,
          cooldown: 5000,
          lastUsed: 0,
          manaCost: 30
        },
        {
          id: 'dragon_roar',
          name: 'Dragon Roar',
          description: 'Fears all enemies',
          type: 'debuff',
          cooldown: 15000,
          lastUsed: 0,
          manaCost: 40
        }
      ]
    };

    this.petTemplates.set('wolf', wolfTemplate);
    this.petTemplates.set('cat', catTemplate);
    this.petTemplates.set('bird', birdTemplate);
    this.petTemplates.set('dragon', dragonTemplate);
  }

  adoptPet(playerId: string, petType: PetType, petName: string): { success: boolean; pet?: Pet; reason?: string } {
    const template = this.petTemplates.get(petType);
    if (!template) {
      return { success: false, reason: 'Invalid pet type' };
    }

    const playerPets = this.playerPets.get(playerId) || [];
    
    // Check if player already has too many pets (limit to 5)
    if (playerPets.length >= 5) {
      return { success: false, reason: 'Maximum number of pets reached' };
    }

    // Check if player already has this type of pet
    const existingPet = playerPets.find(petId => {
      const pet = this.pets.get(petId);
      return pet && pet.type === petType;
    });

    if (existingPet) {
      return { success: false, reason: 'You already have this type of pet' };
    }

    // Create new pet
    const petId = `pet_${playerId}_${Date.now()}`;
    const pet: Pet = {
      id: petId,
      name: petName,
      type: petType,
      rarity: template.rarity,
      level: 1,
      xp: 0,
      hp: template.baseStats.hp,
      maxHp: template.baseStats.hp,
      mp: template.baseStats.mp,
      maxMp: template.baseStats.mp,
      attack: template.baseStats.attack,
      defense: template.baseStats.defense,
      speed: template.baseStats.speed,
      pos: { x: 0, y: 0, z: 0 },
      vel: { vx: 0, vz: 0 },
      dir: 0,
      anim: 'idle',
      ownerId: playerId,
      summoned: false,
      lastActivity: Date.now(),
      abilities: template.abilities.map(ability => ({ ...ability }))
    };

    this.pets.set(petId, pet);
    playerPets.push(petId);
    this.playerPets.set(playerId, playerPets);

    return { success: true, pet };
  }

  summonPet(playerId: string, petId: string, playerPos: Position): { success: boolean; reason?: string } {
    const pet = this.pets.get(petId);
    if (!pet) {
      return { success: false, reason: 'Pet not found' };
    }

    if (pet.ownerId !== playerId) {
      return { success: false, reason: 'You do not own this pet' };
    }

    if (pet.summoned) {
      return { success: false, reason: 'Pet is already summoned' };
    }

    // Position pet near player
    pet.pos = {
      x: playerPos.x + (Math.random() - 0.5) * 2,
      y: playerPos.y,
      z: playerPos.z + (Math.random() - 0.5) * 2
    };

    pet.summoned = true;
    pet.lastActivity = Date.now();

    return { success: true };
  }

  dismissPet(playerId: string, petId: string): { success: boolean; reason?: string } {
    const pet = this.pets.get(petId);
    if (!pet) {
      return { success: false, reason: 'Pet not found' };
    }

    if (pet.ownerId !== playerId) {
      return { success: false, reason: 'You do not own this pet' };
    }

    if (!pet.summoned) {
      return { success: false, reason: 'Pet is not summoned' };
    }

    pet.summoned = false;
    pet.lastActivity = Date.now();

    return { success: true };
  }

  getPlayerPets(playerId: string): Pet[] {
    const petIds = this.playerPets.get(playerId) || [];
    return petIds.map(petId => this.pets.get(petId)).filter(pet => pet !== undefined) as Pet[];
  }

  getSummonedPets(playerId: string): Pet[] {
    return this.getPlayerPets(playerId).filter(pet => pet.summoned);
  }

  getPet(petId: string): Pet | undefined {
    return this.pets.get(petId);
  }

  updatePetPosition(petId: string, pos: Position): void {
    const pet = this.pets.get(petId);
    if (pet) {
      pet.pos = pos;
      pet.lastActivity = Date.now();
    }
  }

  usePetAbility(petId: string, abilityId: string): { success: boolean; reason?: string; damage?: number; healing?: number } {
    const pet = this.pets.get(petId);
    if (!pet) {
      return { success: false, reason: 'Pet not found' };
    }

    if (!pet.summoned) {
      return { success: false, reason: 'Pet is not summoned' };
    }

    const ability = pet.abilities.find(a => a.id === abilityId);
    if (!ability) {
      return { success: false, reason: 'Ability not found' };
    }

    const now = Date.now();
    if (now - ability.lastUsed < ability.cooldown) {
      return { success: false, reason: 'Ability is on cooldown' };
    }

    if (pet.mp < ability.manaCost) {
      return { success: false, reason: 'Not enough mana' };
    }

    // Use ability
    pet.mp -= ability.manaCost;
    ability.lastUsed = now;
    pet.lastActivity = now;

    return {
      success: true,
      damage: ability.damage,
      healing: ability.healing
    };
  }

  gainPetXP(petId: string, xp: number): void {
    const pet = this.pets.get(petId);
    if (!pet) return;

    pet.xp += xp;
    pet.lastActivity = Date.now();

    // Check for level up
    const xpNeeded = pet.level * 100; // Simple XP formula
    if (pet.xp >= xpNeeded) {
      this.levelUpPet(pet);
    }
  }

  private levelUpPet(pet: Pet): void {
    pet.level++;
    pet.xp = 0;

    // Increase stats
    const statIncrease = Math.floor(pet.level / 2) + 1;
    pet.maxHp += statIncrease * 5;
    pet.maxMp += statIncrease * 3;
    pet.attack += statIncrease;
    pet.defense += statIncrease;
    pet.speed += Math.floor(statIncrease / 2);

    // Heal to full
    pet.hp = pet.maxHp;
    pet.mp = pet.maxMp;

    console.log(`Pet ${pet.name} leveled up to level ${pet.level}!`);
  }

  getAvailablePetTypes(): PetType[] {
    return Object.values(PetType);
  }

  getPetTemplate(petType: PetType): PetTemplate | undefined {
    return this.petTemplates.get(petType);
  }
}
