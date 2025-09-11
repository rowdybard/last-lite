import { create } from 'zustand';
import { PlayerState } from '../types/game';

interface PlayerStore {
  player: PlayerState | null;
  setPlayer: (player: PlayerState) => void;
  updateGold: (amount: number) => void;
  addItem: (itemId: string, qty: number) => void;
  removeItem: (itemId: string, qty: number) => void;
  getItemCount: (itemId: string) => number;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  player: null,
  
  setPlayer: (player) => set({ player }),
  
  updateGold: (amount) => set((state) => ({
    player: state.player ? { ...state.player, gold: state.player.gold + amount } : null
  })),
  
  addItem: (itemId, qty) => set((state) => {
    if (!state.player) return state;
    
    const inventory = [...state.player.inventory];
    const existing = inventory.find(i => i.itemId === itemId);
    
    if (existing) {
      existing.qty += qty;
    } else {
      inventory.push({ itemId, qty });
    }
    
    return {
      player: { ...state.player, inventory }
    };
  }),
  
  removeItem: (itemId, qty) => set((state) => {
    if (!state.player) return state;
    
    const inventory = [...state.player.inventory];
    const existing = inventory.find(i => i.itemId === itemId);
    
    if (existing) {
      existing.qty -= qty;
      if (existing.qty <= 0) {
        const index = inventory.indexOf(existing);
        inventory.splice(index, 1);
      }
    }
    
    return {
      player: { ...state.player, inventory }
    };
  }),
  
  getItemCount: (itemId) => {
    const player = get().player;
    if (!player) return 0;
    
    const item = player.inventory.find(i => i.itemId === itemId);
    return item ? item.qty : 0;
  }
}));
