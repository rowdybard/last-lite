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
    dir: number;
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
    name: string;
    type: EntityType;
    pos: Position;
    vel: Velocity;
    dir: number;
    anim: string;
    hp: number;
    maxHp: number;
    level: number;
    aiState: AIState;
    spawnPos?: Position;
    leashDistance?: number;
}
export interface Drop {
    id: string;
    itemId: string;
    pos: Position;
    ownerId?: string;
    createdAt: number;
    ttl: number;
}
export declare enum CharacterClass {
    Warrior = "Warrior",
    Ranger = "Ranger",
    Mage = "Mage"
}
export declare enum EntityType {
    Mob = "mob",
    Npc = "npc",
    Item = "item",
    Door = "door",
    Vendor = "vendor",
    Pet = "pet",
    Boss = "boss"
}
export declare enum AIState {
    Idle = "idle",
    Alert = "alert",
    Chase = "chase",
    Attack = "attack",
    Reset = "reset"
}
export declare enum Rarity {
    Common = "Common",
    Uncommon = "Uncommon",
    Rare = "Rare",
    Epic = "Epic"
}
export declare enum ItemType {
    Weapon = "weapon",
    Armor = "armor",
    Accessory = "accessory",
    Consumable = "consumable",
    Tool = "tool",
    Quest = "quest",
    Misc = "misc"
}
export interface Ability {
    id: string;
    class: CharacterClass;
    gcd: number;
    cd: number;
    cost: number;
    range: number;
    type: AbilityType;
    power: number;
    effect?: AbilityEffect;
}
export declare enum AbilityType {
    Melee = "melee",
    Projectile = "projectile",
    AOE = "aoe"
}
export declare enum AbilityEffect {
    Snare = "snare",
    Guard = "guard",
    Blink = "blink",
    Knockback = "knockback"
}
export interface CombatEvent {
    at: number;
    type: CombatEventType;
    srcId: string;
    dstId: string;
    abilityId?: string;
    amount?: number;
}
export declare enum CombatEventType {
    Damage = "damage",
    Heal = "heal",
    Miss = "miss",
    Death = "death"
}
export interface Door {
    id: string;
    fromZone: string;
    toZone: string;
    pos: Position;
    reqQuestId?: string;
}
export interface Zone {
    id: string;
    name: string;
    type: ZoneType;
    maxPlayers: number;
    doors: Door[];
    spawnPoints: Position[];
}
export declare enum ZoneType {
    Hub = "hub",
    Field = "field",
    Dungeon = "dungeon"
}
export interface ItemTemplate {
    id: string;
    name: string;
    rarity: Rarity;
    slot: string;
    atk?: number;
    def?: number;
    hp?: number;
    mp?: number;
    value: number;
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
export declare enum QuestStepType {
    Talk = "talk",
    Kill = "kill",
    Collect = "collect",
    Enter = "enter"
}
export interface Buff {
    id: string;
    type: BuffType;
    value: number;
    duration: number;
    startTime: number;
}
export declare enum BuffType {
    Speed = "speed",
    Attack = "attack",
    Defense = "defense",
    Heal = "heal"
}
export declare class WorldState {
    players: Map<string, Player>;
    entities: Map<string, Entity>;
    drops: Map<string, Drop>;
    timestamp: number;
}
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
export interface QualityProfile {
    level: 'low' | 'medium' | 'high';
    hardwareScalingLevel: number;
    shadowsEnabled: boolean;
    postProcessingEnabled: boolean;
    maxEntities: number;
}
//# sourceMappingURL=types.d.ts.map