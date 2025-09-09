import { SocketGameServer } from './socket-server.js';

const server = new SocketGameServer();
server.start(3000);
