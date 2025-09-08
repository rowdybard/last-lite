// Game Entity Types
export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Velocity {
  vx: number;
  vz: number;
}

export interface Player {
  id: string;
  name: string;
  class: CharacterClass;
  level: number;
  xp: number;
  pos: Position;
  vel: Velocity;
  dir: number; // rotation in radians
  anim: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  gold: number;
  buffs: Buff[];
  lastGcd: number;
  abilityCooldowns: Map<string, number>;
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Position;
  hp: number;
  maxHp: number;
  aiState: AIState;
  spawnPos?: Position;
  leashDistance?: number;
}

export interface Drop {
  id: string;
  itemId: string;
  pos: Position;
  ownerId?: string; // for personal loot
  createdAt: number;
  ttl: number; // time to live in ms
}

// Enums
export enum CharacterClass {
  Warrior = 'Warrior',
  Ranger = 'Ranger',
  Mage = 'Mage'
}

export enum EntityType {
  Mob = 'mob',
  Door = 'door',
  Vendor = 'vendor',
  Pet = 'pet',
  Boss = 'boss'
}

export enum AIState {
  Idle = 'idle',
  Alert = 'alert',
  Chase = 'chase',
  Attack = 'attack',
  Reset = 'reset'
}

export enum Rarity {
  Common = 'Common',
  Uncommon = 'Uncommon',
  Rare = 'Rare',
  Epic = 'Epic'
}

// Ability System
export interface Ability {
  id: string;
  class: CharacterClass;
  gcd: number; // global cooldown in seconds
  cd: number; // cooldown in seconds
  cost: number; // mp cost
  range: number; // range in meters
  type: AbilityType;
  power: number; // base damage scaling
  effect?: AbilityEffect;
}

export enum AbilityType {
  Melee = 'melee',
  Projectile = 'projectile',
  AOE = 'aoe'
}

export enum AbilityEffect {
  Snare = 'snare',
  Guard = 'guard',
  Blink = 'blink',
  Knockback = 'knockback'
}

// Combat System
export interface CombatEvent {
  at: number; // server time ms
  type: CombatEventType;
  srcId: string; // actor
  dstId: string; // target
  abilityId?: string;
  amount?: number;
}

export enum CombatEventType {
  Damage = 'damage',
  Heal = 'heal',
  Miss = 'miss',
  Death = 'death'
}

// Zone System
export interface Door {
  id: string;
  fromZone: string;
  toZone: string;
  pos: Position;
  reqQuestId?: string; // optional quest requirement
}

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  maxPlayers: number;
  doors: Door[];
  spawnPoints: Position[];
}

export enum ZoneType {
  Hub = 'hub',
  Field = 'field',
  Dungeon = 'dungeon'
}

// Item System
export interface ItemTemplate {
  id: string;
  name: string;
  rarity: Rarity;
  slot: string; // weapon, chest, ring, etc.
  atk?: number;
  def?: number;
  hp?: number;
  mp?: number;
  value: number; // vendor price
}

export interface ItemInstance {
  id: string;
  templateId: string;
  ownerCharId?: string;
  bindOnPickup: boolean;
  createdAt: number;
}

export interface InventorySlot {
  id: string;
  charId: string;
  slotIndex: number;
  itemId?: string;
  quantity: number;
}

// Quest System
export interface QuestState {
  id: string;
  charId: string;
  questId: string;
  step: number;
  completed: boolean;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  steps: QuestStep[];
}

export interface QuestStep {
  id: string;
  type: QuestStepType;
  description: string;
  target?: string;
  count?: number;
  completed: boolean;
}

export enum QuestStepType {
  Talk = 'talk',
  Kill = 'kill',
  Collect = 'collect',
  Enter = 'enter'
}

// Buff System
export interface Buff {
  id: string;
  type: BuffType;
  value: number;
  duration: number; // in ms
  startTime: number;
}

export enum BuffType {
  Speed = 'speed',
  Attack = 'attack',
  Defense = 'defense',
  Heal = 'heal'
}

// World State
export class WorldState {
  players: Map<string, Player> = new Map();
  entities: Map<string, Entity> = new Map();
  drops: Map<string, Drop> = new Map();
  timestamp: number = Date.now();
}

// Client Input Types
export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export interface CastInput {
  abilityId: string;
  targetId?: string;
  targetPos?: Position;
}

export interface ChatInput {
  text: string;
}

export interface SwapZoneInput {
  toZoneId: string;
}

// Quality Profile
export interface QualityProfile {
  level: 'low' | 'medium' | 'high';
  hardwareScalingLevel: number;
  shadowsEnabled: boolean;
  postProcessingEnabled: boolean;
  maxEntities: number;
}
