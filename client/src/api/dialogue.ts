import { apiClient } from './client';
import { DialogueResponse, APIResponse } from '../types/game';

export const dialogueAPI = {
  async advance(currentNodeId: string, optionIndex: number): Promise<APIResponse<DialogueResponse>> {
    return apiClient.post<DialogueResponse>('/dialogue/advance', { currentNodeId, optionIndex });
  }
};
