"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const colyseus_1 = require("colyseus");
const http_1 = require("http");
const hub_room_1 = require("./rooms/hub-room");
async function createServer() {
    const app = (0, express_1.default)();
    const httpServer = (0, http_1.createServer)(app);
    // Middleware
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    // Health check endpoint
    app.get('/healthz', (req, res) => {
        res.status(200).send('OK');
    });
    // Serve static files from client build
    const clientBuildPath = path_1.default.join(__dirname, '../../client/dist');
    app.use(express_1.default.static(clientBuildPath));
    // SPA fallback - serve index.html for all other routes
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.join(clientBuildPath, 'index.html'));
    });
    // Set up Colyseus
    const gameServer = new colyseus_1.Server({
        server: httpServer,
    });
    // Register rooms
    gameServer.define('world:hub', hub_room_1.HubRoom);
    // gameServer.define('world:field', FieldRoom);
    // gameServer.define('dungeon:grave-root', DungeonRoom);
    return httpServer;
}
//# sourceMappingURL=server.js.map