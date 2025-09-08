import { Client } from 'colyseus.js';
import { WorldState } from '../../shared/types';

export class NetworkManager {
  private client: Client;
  private room: any;
  private onStateUpdate?: (state: WorldState) => void;
  private onZoneTransfer?: (data: any) => void;

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.client = new Client(`${protocol}//${host}`);
  }

  async connectToHub(): Promise<void> {
    try {
      this.room = await this.client.joinOrCreate('world:hub', {
        name: 'TestPlayer',
        class: 'Warrior',
      });

      console.log('Connected to hub room:', this.room.id);

      // Listen for state updates
      this.room.onStateChange((state: WorldState) => {
        if (this.onStateUpdate) {
          this.onStateUpdate(state);
        }
      });

      // Listen for errors
      this.room.onError((code: number, message: string) => {
        console.error('Room error:', code, message);
      });

      // Listen for zone transfer messages
      this.room.onMessage('zone_transfer', (data: any) => {
        if (this.onZoneTransfer) {
          this.onZoneTransfer(data);
        }
      });

      // Listen for zone swap errors
      this.room.onMessage('zone_swap_error', (data: any) => {
        console.error('Zone swap error:', data.reason);
      });

    } catch (error) {
      console.error('Failed to connect to hub:', error);
    }
  }

  sendInput(input: { up: boolean; down: boolean; left: boolean; right: boolean }): void {
    if (this.room) {
      this.room.send('input', input);
    }
  }

  sendZoneSwap(toZoneId: string): void {
    if (this.room) {
      this.room.send('swap_zone', { toZoneId });
    }
  }

  setOnStateUpdate(callback: (state: WorldState) => void): void {
    this.onStateUpdate = callback;
  }

  setOnZoneTransfer(callback: (data: any) => void): void {
    this.onZoneTransfer = callback;
  }

  disconnect(): void {
    if (this.room) {
      this.room.leave();
    }
  }
}
