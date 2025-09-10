import { SocketGameServer } from './socket-server.js';

async function startServer() {
  console.log('Starting Socket.io server...');
  try {
    const server = new SocketGameServer();
    console.log('SocketGameServer created successfully');
    await server.start(3000);
    console.log('Server started on port 3000');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
