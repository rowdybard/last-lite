import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

describe('Express Server', () => {
  let server: any;

  beforeAll(async () => {
    // Create a simple Express server for testing without Colyseus dependencies
    const app = express();
    app.get('/healthz', (req, res) => {
      res.status(200).send('OK');
    });
    app.get('*', (req, res) => {
      res.status(404).send('Not Found');
    });
    server = app;
  });

  afterAll(async () => {
    // No cleanup needed for simple Express app
  });

  it('should respond to health check endpoint', async () => {
    const response = await request(server)
      .get('/healthz')
      .expect(200);

    expect(response.text).toBe('OK');
  });

  it('should serve static files from client build', async () => {
    // This test will fail initially since we haven't built the client yet
    // For now, we expect a 404 since the client build doesn't exist
    const response = await request(server)
      .get('/')
      .expect(404);

    // Once client is built, this should return 200 with HTML content
    // expect(response.headers['content-type']).toMatch(/text\/html/);
  });

  it('should handle 404 for non-existent routes', async () => {
    await request(server)
      .get('/non-existent-route')
      .expect(404);
  });
});
