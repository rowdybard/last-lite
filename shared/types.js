"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorldState = exports.BuffType = exports.QuestStepType = exports.ZoneType = exports.CombatEventType = exports.AbilityEffect = exports.AbilityType = exports.ItemType = exports.Rarity = exports.AIState = exports.EntityType = exports.CharacterClass = void 0;
// Enums
var CharacterClass;
(function (CharacterClass) {
    CharacterClass["Warrior"] = "Warrior";
    CharacterClass["Ranger"] = "Ranger";
    CharacterClass["Mage"] = "Mage";
})(CharacterClass || (exports.CharacterClass = CharacterClass = {}));
var EntityType;
(function (EntityType) {
    EntityType["Mob"] = "mob";
    EntityType["Npc"] = "npc";
    EntityType["Item"] = "item";
    EntityType["Door"] = "door";
    EntityType["Vendor"] = "vendor";
    EntityType["Pet"] = "pet";
    EntityType["Boss"] = "boss";
})(EntityType || (exports.EntityType = EntityType = {}));
var AIState;
(function (AIState) {
    AIState["Idle"] = "idle";
    AIState["Alert"] = "alert";
    AIState["Chase"] = "chase";
    AIState["Attack"] = "attack";
    AIState["Reset"] = "reset";
})(AIState || (exports.AIState = AIState = {}));
var Rarity;
(function (Rarity) {
    Rarity["Common"] = "Common";
    Rarity["Uncommon"] = "Uncommon";
    Rarity["Rare"] = "Rare";
    Rarity["Epic"] = "Epic";
})(Rarity || (exports.Rarity = Rarity = {}));
var ItemType;
(function (ItemType) {
    ItemType["Weapon"] = "weapon";
    ItemType["Armor"] = "armor";
    ItemType["Accessory"] = "accessory";
    ItemType["Consumable"] = "consumable";
    ItemType["Tool"] = "tool";
    ItemType["Quest"] = "quest";
    ItemType["Misc"] = "misc";
})(ItemType || (exports.ItemType = ItemType = {}));
var AbilityType;
(function (AbilityType) {
    AbilityType["Melee"] = "melee";
    AbilityType["Projectile"] = "projectile";
    AbilityType["AOE"] = "aoe";
})(AbilityType || (exports.AbilityType = AbilityType = {}));
var AbilityEffect;
(function (AbilityEffect) {
    AbilityEffect["Snare"] = "snare";
    AbilityEffect["Guard"] = "guard";
    AbilityEffect["Blink"] = "blink";
    AbilityEffect["Knockback"] = "knockback";
})(AbilityEffect || (exports.AbilityEffect = AbilityEffect = {}));
var CombatEventType;
(function (CombatEventType) {
    CombatEventType["Damage"] = "damage";
    CombatEventType["Heal"] = "heal";
    CombatEventType["Miss"] = "miss";
    CombatEventType["Death"] = "death";
})(CombatEventType || (exports.CombatEventType = CombatEventType = {}));
var ZoneType;
(function (ZoneType) {
    ZoneType["Hub"] = "hub";
    ZoneType["Field"] = "field";
    ZoneType["Dungeon"] = "dungeon";
})(ZoneType || (exports.ZoneType = ZoneType = {}));
var QuestStepType;
(function (QuestStepType) {
    QuestStepType["Talk"] = "talk";
    QuestStepType["Kill"] = "kill";
    QuestStepType["Collect"] = "collect";
    QuestStepType["Enter"] = "enter";
})(QuestStepType || (exports.QuestStepType = QuestStepType = {}));
var BuffType;
(function (BuffType) {
    BuffType["Speed"] = "speed";
    BuffType["Attack"] = "attack";
    BuffType["Defense"] = "defense";
    BuffType["Heal"] = "heal";
})(BuffType || (exports.BuffType = BuffType = {}));
// World State
class WorldState {
    players = new Map();
    entities = new Map();
    drops = new Map();
    timestamp = Date.now();
}
exports.WorldState = WorldState;
//# sourceMappingURL=types.js.map