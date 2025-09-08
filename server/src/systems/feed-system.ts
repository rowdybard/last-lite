import { Client } from 'colyseus';

export interface FeedMessage {
  at: number;
  text: string;
  type: 'info' | 'combat' | 'loot' | 'quest' | 'error';
  zone?: string;
}

export class FeedSystem {
  private static readonly MAX_FEED_LINES = 200;

  static sendToClient(client: Client, message: FeedMessage): void {
    client.send('feed', message);
  }

  static sendToClients(clients: Client[], message: FeedMessage): void {
    clients.forEach(client => {
      this.sendToClient(client, message);
    });
  }

  static sendToRoom(room: any, message: FeedMessage): void {
    room.clients.forEach((client: Client) => {
      this.sendToClient(client, message);
    });
  }

  static createMessage(text: string, type: FeedMessage['type'], zone?: string): FeedMessage {
    return {
      at: Date.now(),
      text,
      type,
      zone
    };
  }

  static sendInfo(client: Client, text: string, zone?: string): void {
    this.sendToClient(client, this.createMessage(text, 'info', zone));
  }

  static sendCombat(client: Client, text: string, zone?: string): void {
    this.sendToClient(client, this.createMessage(text, 'combat', zone));
  }

  static sendLoot(client: Client, text: string, zone?: string): void {
    this.sendToClient(client, this.createMessage(text, 'loot', zone));
  }

  static sendQuest(client: Client, text: string, zone?: string): void {
    this.sendToClient(client, this.createMessage(text, 'quest', zone));
  }

  static sendError(client: Client, text: string, zone?: string): void {
    this.sendToClient(client, this.createMessage(text, 'error', zone));
  }

  static sendInfoToRoom(room: any, text: string, zone?: string): void {
    this.sendToRoom(room, this.createMessage(text, 'info', zone));
  }

  static sendCombatToRoom(room: any, text: string, zone?: string): void {
    this.sendToRoom(room, this.createMessage(text, 'combat', zone));
  }

  static sendLootToRoom(room: any, text: string, zone?: string): void {
    this.sendToRoom(room, this.createMessage(text, 'loot', zone));
  }

  static sendQuestToRoom(room: any, text: string, zone?: string): void {
    this.sendToRoom(room, this.createMessage(text, 'quest', zone));
  }

  static sendErrorToRoom(room: any, text: string, zone?: string): void {
    this.sendToRoom(room, this.createMessage(text, 'error', zone));
  }
}