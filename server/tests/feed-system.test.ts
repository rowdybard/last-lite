import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedSystem, FeedMessage } from '../src/systems/feed-system.js';

describe('FeedSystem', () => {
  let mockClient: any;
  let mockRoom: any;

  beforeEach(() => {
    mockClient = {
      send: vi.fn(),
    };

    mockRoom = {
      clients: [mockClient, { send: vi.fn() }],
    };
  });

  describe('M0 - Text Mode Vertical Slice', () => {
    it('should create feed messages with correct structure', () => {
      const message = FeedSystem.createMessage('Test message', 'info', 'Hub');
      
      expect(message).toMatchObject({
        text: 'Test message',
        type: 'info',
        zone: 'Hub',
      });
      expect(typeof message.at).toBe('number');
      expect(message.at).toBeGreaterThan(0);
    });

    it('should send messages to single client', () => {
      FeedSystem.sendToClient(mockClient, {
        at: Date.now(),
        text: 'Test message',
        type: 'info',
        zone: 'Hub'
      });

      expect(mockClient.send).toHaveBeenCalledWith('feed', {
        at: expect.any(Number),
        text: 'Test message',
        type: 'info',
        zone: 'Hub'
      });
    });

    it('should send messages to multiple clients', () => {
      const clients = [mockClient, { send: vi.fn() }];
      
      FeedSystem.sendToClients(clients, {
        at: Date.now(),
        text: 'Test message',
        type: 'info',
        zone: 'Hub'
      });

      clients.forEach(client => {
        expect(client.send).toHaveBeenCalledWith('feed', expect.any(Object));
      });
    });

    it('should send messages to room', () => {
      FeedSystem.sendToRoom(mockRoom, {
        at: Date.now(),
        text: 'Test message',
        type: 'info',
        zone: 'Hub'
      });

      mockRoom.clients.forEach((client: any) => {
        expect(client.send).toHaveBeenCalledWith('feed', expect.any(Object));
      });
    });

    it('should send typed messages correctly', () => {
      const messageTypes = ['info', 'combat', 'loot', 'quest', 'error'] as const;
      
      messageTypes.forEach(type => {
        const message = FeedSystem.createMessage(`Test ${type} message`, type, 'Hub');
        expect(message.type).toBe(type);
        expect(message.text).toBe(`Test ${type} message`);
      });
    });

    it('should send info messages with convenience methods', () => {
      FeedSystem.sendInfo(mockClient, 'Info message', 'Hub');
      expect(mockClient.send).toHaveBeenCalledWith('feed', {
        at: expect.any(Number),
        text: 'Info message',
        type: 'info',
        zone: 'Hub'
      });
    });

    it('should send combat messages with convenience methods', () => {
      FeedSystem.sendCombat(mockClient, 'Combat message', 'Hub');
      expect(mockClient.send).toHaveBeenCalledWith('feed', {
        at: expect.any(Number),
        text: 'Combat message',
        type: 'combat',
        zone: 'Hub'
      });
    });

    it('should send loot messages with convenience methods', () => {
      FeedSystem.sendLoot(mockClient, 'Loot message', 'Hub');
      expect(mockClient.send).toHaveBeenCalledWith('feed', {
        at: expect.any(Number),
        text: 'Loot message',
        type: 'loot',
        zone: 'Hub'
      });
    });

    it('should send quest messages with convenience methods', () => {
      FeedSystem.sendQuest(mockClient, 'Quest message', 'Hub');
      expect(mockClient.send).toHaveBeenCalledWith('feed', {
        at: expect.any(Number),
        text: 'Quest message',
        type: 'quest',
        zone: 'Hub'
      });
    });

    it('should send error messages with convenience methods', () => {
      FeedSystem.sendError(mockClient, 'Error message', 'Hub');
      expect(mockClient.send).toHaveBeenCalledWith('feed', {
        at: expect.any(Number),
        text: 'Error message',
        type: 'error',
        zone: 'Hub'
      });
    });

    it('should send room-wide messages with convenience methods', () => {
      const roomMethods = [
        'sendInfoToRoom',
        'sendCombatToRoom', 
        'sendLootToRoom',
        'sendQuestToRoom',
        'sendErrorToRoom'
      ];

      roomMethods.forEach(method => {
        const spy = vi.spyOn(FeedSystem, 'sendToRoom');
        (FeedSystem as any)[method](mockRoom, 'Test message', 'Hub');
        expect(spy).toHaveBeenCalledWith(mockRoom, expect.any(Object));
        spy.mockRestore();
      });
    });

    it('should handle messages without zone', () => {
      const message = FeedSystem.createMessage('Test message', 'info');
      expect(message.zone).toBeUndefined();
    });

    it('should use current timestamp for messages', () => {
      const before = Date.now();
      const message = FeedSystem.createMessage('Test message', 'info');
      const after = Date.now();

      expect(message.at).toBeGreaterThanOrEqual(before);
      expect(message.at).toBeLessThanOrEqual(after);
    });
  });
});