import { CharacterAvatar } from './character-avatar';
import { Player, WorldState } from '../../../shared/types';
import * as BABYLON from '@babylonjs/core';

export class CharacterManager {
  private avatars: Map<string, CharacterAvatar> = new Map();
  private scene: BABYLON.Scene;

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
  }

  updateFromWorldState(worldState: WorldState): void {
    // Update existing avatars
    worldState.players.forEach((player, playerId) => {
      const avatar = this.avatars.get(playerId);
      if (avatar) {
        avatar.updatePlayer(player);
      } else {
        // Create new avatar for new player
        this.createAvatar(player);
      }
    });

    // Remove avatars for players who left
    const currentPlayerIds = new Set(worldState.players.keys());
    this.avatars.forEach((avatar, playerId) => {
      if (!currentPlayerIds.has(playerId)) {
        avatar.dispose();
        this.avatars.delete(playerId);
      }
    });
  }

  createAvatar(player: Player): CharacterAvatar {
    const avatar = new CharacterAvatar(player, this.scene);
    this.avatars.set(player.id, avatar);
    return avatar;
  }

  getAvatar(playerId: string): CharacterAvatar | undefined {
    return this.avatars.get(playerId);
  }

  removeAvatar(playerId: string): void {
    const avatar = this.avatars.get(playerId);
    if (avatar) {
      avatar.dispose();
      this.avatars.delete(playerId);
    }
  }

  dispose(): void {
    this.avatars.forEach((avatar) => avatar.dispose());
    this.avatars.clear();
  }
}
