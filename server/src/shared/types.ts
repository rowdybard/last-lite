// Shared Types for Last Lite Server
export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Velocity {
  x: number;
  y: number;
  z: number;
  vx?: number; // Alternative naming for x velocity
  vz?: number; // Alternative naming for z velocity
}

export interface NPC {
  id: string;
  type: 'vendor' | 'quest' | 'ambient';
  name: string;
  title: string;
  hubPosition: Position;
  avatar?: string;
  dialogueRoot?: string;
  shopId?: string;
}

export interface DialogueOption {
  label: string;
  next: string;
  effects?: Effect[];
  requirements?: Requirement[];
  visibility?: VisibilityCondition;
}

export interface DialogueNode {
  id: string;
  npcId: string;
  text: string;
  options: DialogueOption[];
}

export interface Requirement {
  type: 'hasItem' | 'questStateIs' | 'questCanTurnIn' | 'goldAtLeast' | 'flagTrue';
  itemId?: string;
  qty?: number;
  questId?: string;
  state?: string;
  amount?: number;
  flagName?: string;
}

export interface Effect {
  type: 'giveItem' | 'takeItem' | 'questStart' | 'questComplete' | 'openShop' | 'setFlag' | 'giveGold' | 'takeGold';
  itemId?: string;
  qty?: number;
  questId?: string;
  flagName?: string;
  amount?: number;
  shopId?: string;
}

export interface VisibilityCondition {
  questStateNot?: {
    questId: string;
    state: string;
  };
}

export interface Quest {
  id: string;
  title: string;
  giverId?: string; // Optional for compatibility
  summary?: string; // Optional for compatibility
  description: string;
  objectives?: QuestObjective[]; // Optional for compatibility
  rewards?: QuestRewards; // Optional for compatibility
  prerequisites: string[];
  repeatable: boolean;
  type?: string; // For compatibility with existing quest system
  steps?: QuestStep[]; // For compatibility with existing quest system
  level?: number; // Quest level requirement
}

export interface QuestObjective {
  type: 'collect' | 'kill' | 'reach';
  itemId?: string;
  qty?: number;
  targetId?: string;
  locationId?: string;
}

export interface QuestRewards {
  xp: number;
  gold: number;
  items?: Array<{
    itemId: string;
    qty: number;
  }>;
}

export interface Item {
  id: string;
  name: string;
  type: 'consumable' | 'weapon' | 'armor' | 'material' | 'junk' | 'quest';
  desc: string;
  stack: number;
  baseValue: number;
}

export interface Shop {
  id: string;
  vendorId: string;
  buybackLimit: number;
  inventory: ShopItem[];
  sellRules: SellRules;
}

export interface ShopItem {
  itemId: string;
  stock: number; // -1 for unlimited
  priceOverride?: number;
}

export interface SellRules {
  enabled: boolean;
  priceFactor: number;
  blacklistItemTypes: string[];
}

export interface Hub {
  id: string;
  name: string;
  npcs: string[];
  ambientText: string[];
}

export interface PlayerState {
  gold: number;
  inventory: InventoryItem[];
  questLog: QuestLogEntry[];
  flags: Record<string, boolean>;
}

export interface InventoryItem {
  itemId: string;
  qty: number;
}

export interface QuestLogEntry {
  questId: string;
  state: 'NotStarted' | 'InProgress' | 'Completed' | 'TurnedIn';
  progress: Record<string, number>;
}

// API Response Types
export interface APIResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface ShopInventoryItem {
  item: Item;
  stock: number;
  price: number;
}

export interface DialogueResponse {
  nextNode: string | 'end';
  player: PlayerState;
  errors?: string[];
}

export interface QuestResponse {
  ok: boolean;
  rewards?: QuestRewards;
  player: PlayerState;
}

// Additional types for existing game systems
export interface Player {
  id: string;
  name: string;
  pos: Position;
  vel: Velocity;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  xp: number;
  gold: number;
  inventory: InventoryItem[];
  equipment: Record<string, string>;
  abilities: string[];
  lastActivity: number;
  lastMoveDirection?: string;
  questLog: QuestLogEntry[];
  flags: Record<string, boolean>;
  class?: string; // Character class
  lastGcd?: number; // Last global cooldown
  abilityCooldowns?: Record<string, number>; // Ability cooldowns
  buffs?: Record<string, any>; // Active buffs
  debuffs?: Record<string, any>; // Active debuffs
  dir?: number; // Direction
  anim?: string; // Animation
}

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  pos: Position;
  vel: Velocity;
  level: number;
  hp: number;
  maxHp: number;
  aiState: AIState;
  spawnPos: Position;
  lastActivity: number;
  leashDistance?: number; // AI leash distance
  dir?: number; // Direction
  anim?: string; // Animation
}

export type EntityType = 'player' | 'mob' | 'npc' | 'door' | 'building' | 'vendor';

export type AIState = 'idle' | 'patrol' | 'chase' | 'attack' | 'return' | 'dead' | { current: string; lastUpdate: number };

export interface WorldState {
  players: Record<string, Player>;
  entities: Record<string, Entity>;
  drops: Record<string, Drop>;
  timestamp: number;
}

export interface Drop {
  id: string;
  itemId: string;
  pos: Position;
  qty: number;
  timestamp: number;
}

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Ability {
  id: string;
  name?: string; // Optional for compatibility
  type: AbilityType;
  description?: string; // Optional for compatibility
  cooldown?: number; // Optional for compatibility
  manaCost?: number; // Optional for compatibility
  range: number;
  effects?: AbilityEffect[]; // Optional for compatibility
  class: CharacterClass;
  gcd?: number; // Global cooldown
  cd?: number; // Cooldown
  cost?: number; // Mana cost
  power?: number; // Damage/healing power
  effect?: string; // Single effect type
}

export type AbilityType = 'damage' | 'heal' | 'buff' | 'debuff' | 'utility';

export interface AbilityEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff';
  value: number;
  duration?: number;
  target: 'self' | 'enemy' | 'ally' | 'area';
}

export type CharacterClass = 'Warrior' | 'Mage' | 'Rogue' | 'Cleric';

// Enum-like objects for runtime use
export const CharacterClassEnum = {
  Warrior: 'Warrior' as CharacterClass,
  Mage: 'Mage' as CharacterClass,
  Rogue: 'Rogue' as CharacterClass,
  Cleric: 'Cleric' as CharacterClass
};

export const AbilityTypeEnum = {
  damage: 'damage' as AbilityType,
  heal: 'heal' as AbilityType,
  buff: 'buff' as AbilityType,
  debuff: 'debuff' as AbilityType,
  utility: 'utility' as AbilityType,
  Melee: 'damage' as AbilityType,
  AOE: 'damage' as AbilityType,
  Projectile: 'damage' as AbilityType
};

export const AbilityEffectEnum = {
  damage: 'damage' as const,
  heal: 'heal' as const,
  buff: 'buff' as const,
  debuff: 'debuff' as const,
  Guard: 'buff' as const,
  Blink: 'utility' as const,
  Snare: 'debuff' as const
};

export const RarityEnum = {
  common: 'common' as Rarity,
  uncommon: 'uncommon' as Rarity,
  rare: 'rare' as Rarity,
  epic: 'epic' as Rarity,
  legendary: 'legendary' as Rarity
};

export const CombatEventTypeEnum = {
  damage: 'damage' as CombatEventType,
  heal: 'heal' as CombatEventType,
  ability_used: 'ability_used' as CombatEventType,
  death: 'death' as CombatEventType,
  respawn: 'respawn' as CombatEventType
};

export const EntityTypeEnum = {
  player: 'player' as EntityType,
  mob: 'mob' as EntityType,
  npc: 'npc' as EntityType,
  door: 'door' as EntityType,
  building: 'building' as EntityType,
  vendor: 'vendor' as EntityType
};

export interface CombatEvent {
  type: CombatEventType;
  source: string;
  target: string;
  damage?: number;
  healing?: number;
  ability?: string;
  timestamp: number;
  at?: number; // Alternative timestamp property
  srcId?: string; // Source ID for compatibility
}

export type CombatEventType = 'damage' | 'heal' | 'ability_used' | 'death' | 'respawn';

export interface QuestState {
  id: string;
  playerId: string;
  questId: string;
  currentStep: number;
  completed: boolean;
  timestamp: number;
}

export interface QuestStep {
  id: string;
  type: 'kill' | 'collect' | 'reach' | 'talk';
  target?: string;
  qty?: number;
  location?: Position;
  description: string;
  completed: boolean;
  title?: string; // Alternative title property
  objectives?: any[]; // Quest objectives
  rewards?: any; // Quest rewards
}

export interface QuestReward {
  type: 'xp' | 'gold' | 'item';
  value: number;
  itemId?: string;
}