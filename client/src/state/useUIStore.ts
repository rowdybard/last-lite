import { create } from 'zustand';
import { NPC, DialogueNode } from '../types/game';

interface UIStore {
  currentModal: 'none' | 'dialogue' | 'shop' | 'quests';
  selectedNPC: NPC | null;
  currentDialogueNode: DialogueNode | null;
  selectedShopId: string | null;
  ambientTextIndex: number;
  
  openDialogue: (npc: NPC, node: DialogueNode) => void;
  openShop: (shopId: string) => void;
  openQuests: () => void;
  closeModal: () => void;
  setCurrentDialogueNode: (node: DialogueNode | null) => void;
  nextAmbientText: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  currentModal: 'none',
  selectedNPC: null,
  currentDialogueNode: null,
  selectedShopId: null,
  ambientTextIndex: 0,
  
  openDialogue: (npc, node) => set({
    currentModal: 'dialogue',
    selectedNPC: npc,
    currentDialogueNode: node
  }),
  
  openShop: (shopId) => set({
    currentModal: 'shop',
    selectedShopId: shopId
  }),
  
  openQuests: () => set({
    currentModal: 'quests'
  }),
  
  closeModal: () => set({
    currentModal: 'none',
    selectedNPC: null,
    currentDialogueNode: null,
    selectedShopId: null
  }),
  
  setCurrentDialogueNode: (node) => set({
    currentDialogueNode: node
  }),
  
  nextAmbientText: () => set((state) => ({
    ambientTextIndex: (state.ambientTextIndex + 1) % 2 // Assuming 2 ambient texts
  }))
}));
