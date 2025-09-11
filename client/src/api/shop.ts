import { apiClient } from './client';
import { Shop, ShopInventoryItem, PlayerState, APIResponse } from '../types/game';

export const shopAPI = {
  async getShop(shopId: string): Promise<APIResponse<{ shop: Shop; inventoryResolved: ShopInventoryItem[] }>> {
    return apiClient.get<{ shop: Shop; inventoryResolved: ShopInventoryItem[] }>(`/shop/${shopId}`);
  },

  async buyItem(shopId: string, itemId: string, qty: number): Promise<APIResponse<{ player: PlayerState }>> {
    return apiClient.post<{ player: PlayerState }>('/shop/buy', { shopId, itemId, qty });
  },

  async sellItem(shopId: string, itemId: string, qty: number): Promise<APIResponse<{ player: PlayerState }>> {
    return apiClient.post<{ player: PlayerState }>('/shop/sell', { shopId, itemId, qty });
  }
};
