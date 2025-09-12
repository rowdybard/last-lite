import { Ability, CharacterClass, CharacterClassEnum, AbilityTypeEnum, AbilityEffectEnum } from '../shared/types.js';

export const ABILITIES: Ability[] = [
  // Warrior Abilities
  {
    id: 'Slash',
    class: CharacterClassEnum.Warrior,
    gcd: 1.0,
    cd: 0,
    cost: 0,
    range: 2,
    type: AbilityTypeEnum.Melee,
    power: 10,
  },
  {
    id: 'Guard',
    class: CharacterClassEnum.Warrior,
    gcd: 1.0,
    cd: 8.0,
    cost: 5,
    range: 0,
    type: AbilityTypeEnum.Melee,
    power: 0,
    effect: AbilityEffectEnum.Guard,
  },
  {
    id: 'Leap',
    class: CharacterClassEnum.Warrior,
    gcd: 1.0,
    cd: 8.0,
    cost: 10,
    range: 5,
    type: AbilityTypeEnum.Melee,
    power: 15,
  },
  {
    id: 'Whirlwind',
    class: CharacterClassEnum.Warrior,
    gcd: 1.0,
    cd: 12.0,
    cost: 15,
    range: 3,
    type: AbilityTypeEnum.AOE,
    power: 8,
  },

  // Rogue Abilities (using Rogue instead of Ranger)
  {
    id: 'Quickshot',
    class: CharacterClassEnum.Rogue,
    gcd: 1.0,
    cd: 0,
    cost: 0,
    range: 8,
    type: AbilityTypeEnum.Projectile,
    power: 12,
  },
  {
    id: 'Roll',
    class: CharacterClassEnum.Rogue,
    gcd: 1.0,
    cd: 6.0,
    cost: 5,
    range: 0,
    type: AbilityTypeEnum.Melee,
    power: 0,
    effect: AbilityEffectEnum.Blink,
  },
  {
    id: 'Multi-shot',
    class: CharacterClassEnum.Rogue,
    gcd: 1.0,
    cd: 10.0,
    cost: 12,
    range: 8,
    type: AbilityTypeEnum.AOE,
    power: 6,
  },
  {
    id: 'Snare',
    class: CharacterClassEnum.Rogue,
    gcd: 1.0,
    cd: 8.0,
    cost: 8,
    range: 8,
    type: AbilityTypeEnum.Projectile,
    power: 5,
    effect: AbilityEffectEnum.Snare,
  },

  // Mage Abilities
  {
    id: 'Magic Bolt',
    class: CharacterClassEnum.Mage,
    gcd: 1.0,
    cd: 0,
    cost: 5,
    range: 10,
    type: AbilityTypeEnum.Projectile,
    power: 15,
  },
  {
    id: 'Blink',
    class: CharacterClassEnum.Mage,
    gcd: 1.0,
    cd: 8.0,
    cost: 10,
    range: 0,
    type: AbilityTypeEnum.Melee,
    power: 0,
    effect: AbilityEffectEnum.Blink,
  },
  {
    id: 'Fireburst',
    class: CharacterClassEnum.Mage,
    gcd: 1.0,
    cd: 10.0,
    cost: 20,
    range: 5,
    type: AbilityTypeEnum.AOE,
    power: 25,
  },
  {
    id: 'Frost Nova',
    class: CharacterClassEnum.Mage,
    gcd: 1.0,
    cd: 12.0,
    cost: 15,
    range: 4,
    type: AbilityTypeEnum.AOE,
    power: 12,
    effect: AbilityEffectEnum.Snare,
  },
];

export function getAbilitiesForClass(characterClass: CharacterClass): Ability[] {
  return ABILITIES.filter(ability => ability.class === characterClass);
}

export function getAbilityById(id: string): Ability | undefined {
  return ABILITIES.find(ability => ability.id === id);
}
