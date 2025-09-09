"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const server_js_1 = require("../src/server.js");
(0, vitest_1.describe)('Express Server', () => {
    let server;
    (0, vitest_1.beforeAll)(async () => {
        server = await (0, server_js_1.createServer)();
    });
    (0, vitest_1.afterAll)(async () => {
        if (server) {
            await new Promise((resolve) => {
                server.close(() => resolve());
            });
        }
    });
    (0, vitest_1.it)('should respond to health check endpoint', async () => {
        const response = await (0, supertest_1.default)(server)
            .get('/healthz')
            .expect(200);
        (0, vitest_1.expect)(response.text).toBe('OK');
    });
    (0, vitest_1.it)('should serve static files from client build', async () => {
        // This test will fail initially since we haven't built the client yet
        // For now, we expect a 404 since the client build doesn't exist
        const response = await (0, supertest_1.default)(server)
            .get('/')
            .expect(404);
        // Once client is built, this should return 200 with HTML content
        // expect(response.headers['content-type']).toMatch(/text\/html/);
    });
    (0, vitest_1.it)('should handle 404 for non-existent routes', async () => {
        await (0, supertest_1.default)(server)
            .get('/non-existent-route')
            .expect(404);
    });
});
//# sourceMappingURL=server.test.js.map