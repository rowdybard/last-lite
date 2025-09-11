// Game Types for Last Lite
export interface Position {
  x: number;
  y: number;
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
  giverId: string;
  summary: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestRewards;
  prerequisites: string[];
  repeatable: boolean;
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
