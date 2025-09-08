import express from 'express';
import cors from 'cors';
import path from 'path';
import { Server } from 'colyseus';
import { createServer as createHttpServer } from 'http';
import { HubRoom } from './rooms/hub-room.js';
import { FieldRoom } from './rooms/field-room.js';

export async function createServer(): Promise<any> {
  const app = express();
  const httpServer = createHttpServer(app);

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/healthz', (req, res) => {
    res.status(200).send('OK');
  });

  // Serve static files from client build
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));

  // SPA fallback - serve index.html for all other routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });

  // Set up Colyseus
  const gameServer = new Server({
    server: httpServer,
  });

  // Register rooms
  gameServer.define('world:hub', HubRoom);
  gameServer.define('world:field:1', FieldRoom);
  // gameServer.define('dungeon:grave-root', DungeonRoom);

  return httpServer;
}
