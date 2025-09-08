"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const PORT = process.env.PORT || 3000;
async function startServer() {
    try {
        const app = await (0, server_1.createServer)();
        app.listen(PORT, () => {
            console.log(`🚀 Last-Lite server running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/healthz`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=index.js.map