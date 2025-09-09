import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import path from 'path';

// Mock the SocketGameServer to test routes only
const mockApp = express();

// Mock static file serving
mockApp.use(express.static(path.join(__dirname, '../../client/dist')));

// Mock routes
mockApp.get('/', (req, res) => {
  res.sendFile('homepage.html', { root: path.join(__dirname, '../../client/dist') });
});

mockApp.get('/game.html', (req, res) => {
  res.sendFile('polished-game.html', { root: path.join(__dirname, '../../client/dist') });
});

mockApp.get('/healthz', (req, res) => {
  res.send('OK');
});

describe('Server Routes', () => {
  it('should serve homepage at root route', async () => {
    const response = await request(mockApp)
      .get('/')
      .expect(200);
    
    expect(response.text).toContain('Last-Lite MMO');
    expect(response.text).toContain('Get Started');
  });

  it('should serve game at /game.html route', async () => {
    const response = await request(mockApp)
      .get('/game.html')
      .expect(200);
    
    expect(response.text).toContain('Last-Lite MMO');
    expect(response.text).toContain('World Information');
  });

  it('should serve health check at /healthz', async () => {
    const response = await request(mockApp)
      .get('/healthz')
      .expect(200);
    
    expect(response.text).toBe('OK');
  });

  it('should handle game.html with user parameters', async () => {
    const userData = encodeURIComponent(JSON.stringify({
      username: 'testuser',
      characterName: 'TestChar',
      characterClass: 'Warrior'
    }));
    
    const response = await request(mockApp)
      .get(`/game.html?user=${userData}`)
      .expect(200);
    
    expect(response.text).toContain('Last-Lite MMO');
  });
});
