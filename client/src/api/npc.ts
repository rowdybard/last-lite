import { apiClient } from './client';
import { NPC, APIResponse } from '../types/game';

export const npcAPI = {
  async getAll(): Promise<APIResponse<NPC[]>> {
    return apiClient.get<NPC[]>('/npcs');
  },

  async getById(id: string): Promise<APIResponse<NPC>> {
    return apiClient.get<NPC>(`/npcs/${id}`);
  }
};
