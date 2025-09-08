import { Ability, CharacterClass, AbilityType, AbilityEffect } from '@shared/types';

export const ABILITIES: Ability[] = [
  // Warrior Abilities
  {
    id: 'Slash',
    class: CharacterClass.Warrior,
    gcd: 1.0,
    cd: 0,
    cost: 0,
    range: 2,
    type: AbilityType.Melee,
    power: 10,
  },
  {
    id: 'Guard',
    class: CharacterClass.Warrior,
    gcd: 1.0,
    cd: 8.0,
    cost: 5,
    range: 0,
    type: AbilityType.Melee,
    power: 0,
    effect: AbilityEffect.Guard,
  },
  {
    id: 'Leap',
    class: CharacterClass.Warrior,
    gcd: 1.0,
    cd: 8.0,
    cost: 10,
    range: 5,
    type: AbilityType.Melee,
    power: 15,
  },
  {
    id: 'Whirlwind',
    class: CharacterClass.Warrior,
    gcd: 1.0,
    cd: 12.0,
    cost: 15,
    range: 3,
    type: AbilityType.AOE,
    power: 8,
  },

  // Ranger Abilities
  {
    id: 'Quickshot',
    class: CharacterClass.Ranger,
    gcd: 1.0,
    cd: 0,
    cost: 0,
    range: 8,
    type: AbilityType.Projectile,
    power: 12,
  },
  {
    id: 'Roll',
    class: CharacterClass.Ranger,
    gcd: 1.0,
    cd: 6.0,
    cost: 5,
    range: 0,
    type: AbilityType.Melee,
    power: 0,
    effect: AbilityEffect.Blink,
  },
  {
    id: 'Multi-shot',
    class: CharacterClass.Ranger,
    gcd: 1.0,
    cd: 10.0,
    cost: 12,
    range: 8,
    type: AbilityType.AOE,
    power: 6,
  },
  {
    id: 'Snare',
    class: CharacterClass.Ranger,
    gcd: 1.0,
    cd: 8.0,
    cost: 8,
    range: 8,
    type: AbilityType.Projectile,
    power: 5,
    effect: AbilityEffect.Snare,
  },

  // Mage Abilities
  {
    id: 'Magic Bolt',
    class: CharacterClass.Mage,
    gcd: 1.0,
    cd: 0,
    cost: 5,
    range: 10,
    type: AbilityType.Projectile,
    power: 15,
  },
  {
    id: 'Blink',
    class: CharacterClass.Mage,
    gcd: 1.0,
    cd: 8.0,
    cost: 10,
    range: 0,
    type: AbilityType.Melee,
    power: 0,
    effect: AbilityEffect.Blink,
  },
  {
    id: 'Fireburst',
    class: CharacterClass.Mage,
    gcd: 1.0,
    cd: 10.0,
    cost: 20,
    range: 5,
    type: AbilityType.AOE,
    power: 25,
  },
  {
    id: 'Frost Nova',
    class: CharacterClass.Mage,
    gcd: 1.0,
    cd: 12.0,
    cost: 15,
    range: 4,
    type: AbilityType.AOE,
    power: 12,
    effect: AbilityEffect.Snare,
  },
];

export function getAbilitiesForClass(characterClass: CharacterClass): Ability[] {
  return ABILITIES.filter(ability => ability.class === characterClass);
}

export function getAbilityById(id: string): Ability | undefined {
  return ABILITIES.find(ability => ability.id === id);
}
