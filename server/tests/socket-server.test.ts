import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SocketGameServer } from '../src/socket-server.js';
import { io as Client } from 'socket.io-client';

describe('Socket.io Game Server', () => {
  let server: SocketGameServer;
  let client: any;

  beforeEach(() => {
    // Create server instance
    server = new SocketGameServer();
    server.start(3001); // Use different port for testing
  });

  afterEach(() => {
    if (client) {
      client.disconnect();
    }
    // Clean up server
    if (server) {
      // Add cleanup logic here
    }
  });

  it('should start without errors', () => {
    expect(server).toBeDefined();
  });

  it('should handle client connection', (done) => {
    client = Client('http://localhost:3001');
    
    client.on('connect', () => {
      expect(client.connected).toBe(true);
      done();
    });
  });

  it('should handle client disconnection', (done) => {
    client = Client('http://localhost:3001');
    
    client.on('connect', () => {
      client.disconnect();
    });
    
    client.on('disconnect', () => {
      expect(client.connected).toBe(false);
      done();
    });
  });

  it('should handle room joining', (done) => {
    client = Client('http://localhost:3001');
    
    client.on('connect', () => {
      client.emit('join_room', {
        roomName: 'world_hub',
        playerName: 'TestPlayer',
        playerClass: 'Warrior'
      });
    });
    
    client.on('state', (state: any) => {
      expect(state).toBeDefined();
      expect(state.players).toBeDefined();
      done();
    });
  });

  it('should handle commands', (done) => {
    client = Client('http://localhost:3001');
    
    client.on('connect', () => {
      client.emit('join_room', {
        roomName: 'world_hub',
        playerName: 'TestPlayer',
        playerClass: 'Warrior'
      });
    });
    
    client.on('state', () => {
      client.emit('command', { text: 'help' });
    });
    
    client.on('message', (message: any) => {
      expect(message.text).toContain('Available commands');
      done();
    });
  });
});
