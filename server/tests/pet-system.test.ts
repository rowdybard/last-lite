import { describe, it, expect, beforeEach } from 'vitest';
import { PetSystem, PetType, PetRarity } from '../src/systems/pet';

describe('PetSystem', () => {
  let petSystem: PetSystem;

  beforeEach(() => {
    petSystem = new PetSystem();
  });

  describe('Pet Templates', () => {
    it('should initialize with pet templates', () => {
      const wolfTemplate = petSystem.getPetTemplate(PetType.Wolf);
      expect(wolfTemplate).toBeDefined();
      expect(wolfTemplate?.type).toBe(PetType.Wolf);
      expect(wolfTemplate?.rarity).toBe(PetRarity.Common);
      expect(wolfTemplate?.baseStats.hp).toBe(80);
    });

    it('should have different stats for different pet types', () => {
      const wolfTemplate = petSystem.getPetTemplate(PetType.Wolf);
      const catTemplate = petSystem.getPetTemplate(PetType.Cat);
      
      expect(wolfTemplate?.baseStats.hp).toBeGreaterThan(catTemplate?.baseStats.hp || 0);
      expect(catTemplate?.baseStats.speed).toBeGreaterThan(wolfTemplate?.baseStats.speed || 0);
    });

    it('should have abilities for each pet type', () => {
      const wolfTemplate = petSystem.getPetTemplate(PetType.Wolf);
      expect(wolfTemplate?.abilities).toHaveLength(2);
      expect(wolfTemplate?.abilities[0].id).toBe('wolf_bite');
      expect(wolfTemplate?.abilities[1].id).toBe('wolf_howl');
    });
  });

  describe('Pet Adoption', () => {
    it('should successfully adopt a pet', () => {
      const result = petSystem.adoptPet('player1', PetType.Wolf, 'Fluffy');
      expect(result.success).toBe(true);
      expect(result.pet).toBeDefined();
      expect(result.pet?.name).toBe('Fluffy');
      expect(result.pet?.type).toBe(PetType.Wolf);
      expect(result.pet?.ownerId).toBe('player1');
    });

    it('should not allow adopting same pet type twice', () => {
      petSystem.adoptPet('player1', PetType.Wolf, 'Fluffy');
      const result = petSystem.adoptPet('player1', PetType.Wolf, 'Rex');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('You already have this type of pet');
    });

    it('should allow adopting different pet types', () => {
      petSystem.adoptPet('player1', PetType.Wolf, 'Fluffy');
      const result = petSystem.adoptPet('player1', PetType.Cat, 'Whiskers');
      expect(result.success).toBe(true);
      expect(result.pet?.type).toBe(PetType.Cat);
    });

    it('should enforce pet limit', () => {
      // Adopt a wolf first
      const result1 = petSystem.adoptPet('player1', PetType.Wolf, 'Wolf1');
      expect(result1.success).toBe(true);
      
      // Try to adopt another wolf (different name) - should fail due to same type
      const result2 = petSystem.adoptPet('player1', PetType.Wolf, 'Wolf2');
      expect(result2.success).toBe(false);
      expect(result2.reason).toBe('You already have this type of pet');
      
      // Verify we still only have 1 pet
      const pets = petSystem.getPlayerPets('player1');
      expect(pets).toHaveLength(1);
    });

    it('should not allow invalid pet type', () => {
      const result = petSystem.adoptPet('player1', 'invalid' as PetType, 'Test');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Invalid pet type');
    });
  });

  describe('Pet Management', () => {
    let petId: string;

    beforeEach(() => {
      const result = petSystem.adoptPet('player1', PetType.Wolf, 'Fluffy');
      petId = result.pet!.id;
    });

    it('should get player pets', () => {
      const pets = petSystem.getPlayerPets('player1');
      expect(pets).toHaveLength(1);
      expect(pets[0].name).toBe('Fluffy');
    });

    it('should get specific pet', () => {
      const pet = petSystem.getPet(petId);
      expect(pet).toBeDefined();
      expect(pet?.name).toBe('Fluffy');
    });

    it('should return undefined for non-existent pet', () => {
      const pet = petSystem.getPet('nonexistent');
      expect(pet).toBeUndefined();
    });

    it('should summon pet successfully', () => {
      const result = petSystem.summonPet('player1', petId, { x: 0, y: 0, z: 0 });
      expect(result.success).toBe(true);
      
      const pet = petSystem.getPet(petId);
      expect(pet?.summoned).toBe(true);
    });

    it('should not summon already summoned pet', () => {
      petSystem.summonPet('player1', petId, { x: 0, y: 0, z: 0 });
      const result = petSystem.summonPet('player1', petId, { x: 0, y: 0, z: 0 });
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Pet is already summoned');
    });

    it('should dismiss pet successfully', () => {
      petSystem.summonPet('player1', petId, { x: 0, y: 0, z: 0 });
      const result = petSystem.dismissPet('player1', petId);
      expect(result.success).toBe(true);
      
      const pet = petSystem.getPet(petId);
      expect(pet?.summoned).toBe(false);
    });

    it('should not dismiss non-summoned pet', () => {
      const result = petSystem.dismissPet('player1', petId);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Pet is not summoned');
    });

    it('should get summoned pets', () => {
      petSystem.summonPet('player1', petId, { x: 0, y: 0, z: 0 });
      
      const summonedPets = petSystem.getSummonedPets('player1');
      expect(summonedPets).toHaveLength(1);
      expect(summonedPets[0].id).toBe(petId);
    });
  });

  describe('Pet Abilities', () => {
    let petId: string;

    beforeEach(() => {
      const result = petSystem.adoptPet('player1', PetType.Wolf, 'Fluffy');
      petId = result.pet!.id;
      petSystem.summonPet('player1', petId, { x: 0, y: 0, z: 0 });
    });

    it('should use pet ability successfully', () => {
      const result = petSystem.usePetAbility(petId, 'wolf_bite');
      expect(result.success).toBe(true);
      expect(result.damage).toBe(30);
    });

    it('should not use ability if pet not summoned', () => {
      petSystem.dismissPet('player1', petId);
      const result = petSystem.usePetAbility(petId, 'wolf_bite');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Pet is not summoned');
    });

    it('should not use non-existent ability', () => {
      const result = petSystem.usePetAbility(petId, 'nonexistent');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Ability not found');
    });

    it('should respect ability cooldown', () => {
      petSystem.usePetAbility(petId, 'wolf_bite');
      const result = petSystem.usePetAbility(petId, 'wolf_bite');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Ability is on cooldown');
    });

    it('should consume mana when using ability', () => {
      const pet = petSystem.getPet(petId);
      const initialMp = pet!.mp;
      
      petSystem.usePetAbility(petId, 'wolf_bite');
      
      const updatedPet = petSystem.getPet(petId);
      expect(updatedPet?.mp).toBe(initialMp - 10); // wolf_bite costs 10 mana
    });

    it('should not use ability if insufficient mana', () => {
      const pet = petSystem.getPet(petId);
      pet!.mp = 5; // Less than wolf_bite cost of 10
      
      const result = petSystem.usePetAbility(petId, 'wolf_bite');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Not enough mana');
    });
  });

  describe('Pet Experience and Leveling', () => {
    let petId: string;

    beforeEach(() => {
      const result = petSystem.adoptPet('player1', PetType.Wolf, 'Fluffy');
      petId = result.pet!.id;
    });

    it('should gain experience', () => {
      const pet = petSystem.getPet(petId);
      const initialXp = pet!.xp;
      
      petSystem.gainPetXP(petId, 50);
      
      const updatedPet = petSystem.getPet(petId);
      expect(updatedPet?.xp).toBe(initialXp + 50);
    });

    it('should level up when enough experience is gained', () => {
      const pet = petSystem.getPet(petId);
      const initialLevel = pet!.level;
      const initialMaxHp = pet!.maxHp;
      
      // Gain enough XP to level up (level 1 needs 100 XP)
      petSystem.gainPetXP(petId, 100);
      
      const updatedPet = petSystem.getPet(petId);
      expect(updatedPet?.level).toBe(initialLevel + 1);
      expect(updatedPet?.maxHp).toBeGreaterThan(initialMaxHp);
      expect(updatedPet?.xp).toBe(0); // XP should reset after level up
    });

    it('should heal to full health on level up', () => {
      const pet = petSystem.getPet(petId);
      pet!.hp = 10; // Damage the pet
      
      petSystem.gainPetXP(petId, 100);
      
      const updatedPet = petSystem.getPet(petId);
      expect(updatedPet?.hp).toBe(updatedPet?.maxHp);
    });
  });

  describe('Pet Position Updates', () => {
    let petId: string;

    beforeEach(() => {
      const result = petSystem.adoptPet('player1', PetType.Wolf, 'Fluffy');
      petId = result.pet!.id;
    });

    it('should update pet position', () => {
      const newPos = { x: 10, y: 5, z: 15 };
      petSystem.updatePetPosition(petId, newPos);
      
      const pet = petSystem.getPet(petId);
      expect(pet?.pos).toEqual(newPos);
    });
  });

  describe('Available Pet Types', () => {
    it('should return all available pet types', () => {
      const types = petSystem.getAvailablePetTypes();
      expect(types).toContain(PetType.Wolf);
      expect(types).toContain(PetType.Cat);
      expect(types).toContain(PetType.Bird);
      expect(types).toContain(PetType.Dragon);
    });
  });
});
