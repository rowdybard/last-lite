import { apiClient } from './client';
import { Quest, QuestResponse, PlayerState, APIResponse } from '../types/game';

export const questAPI = {
  async getAll(): Promise<APIResponse<Quest[]>> {
    return apiClient.get<Quest[]>('/quests');
  },

  async start(questId: string): Promise<APIResponse<{ player: PlayerState }>> {
    return apiClient.post<{ player: PlayerState }>('/quests/start', { questId });
  },

  async complete(questId: string): Promise<APIResponse<QuestResponse>> {
    return apiClient.post<QuestResponse>('/quests/complete', { questId });
  },

  async getPlayer(): Promise<APIResponse<PlayerState>> {
    return apiClient.get<PlayerState>('/player');
  },

  async debugGiveItem(itemId: string, qty: number): Promise<APIResponse<PlayerState>> {
    return apiClient.post<PlayerState>('/player/debugGive', { itemId, qty });
  }
};
