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
  // Try multiple possible paths for deployment flexibility
  const possiblePaths = [
    path.join(__dirname, '../../client/dist'),  // Local development
    path.join(__dirname, '../client/dist'),     // Alternative deployment
    path.join(process.cwd(), 'client/dist'),    // From project root
    path.join(process.cwd(), 'src/client/dist') // Render deployment
  ];
  
  let clientBuildPath = possiblePaths.find(p => {
    try {
      return require('fs').existsSync(p);
    } catch {
      return false;
    }
  });
  
  if (!clientBuildPath) {
    console.error('Client build not found. Tried paths:', possiblePaths);
    clientBuildPath = possiblePaths[0]; // Fallback to first path
  }
  
  console.log('Serving client from:', clientBuildPath);
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
  gameServer.define('world_hub', HubRoom);
  gameServer.define('world_field_1', FieldRoom);
  // gameServer.define('dungeon:grave-root', DungeonRoom);

  return httpServer;
}
