"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRoom = void 0;
const colyseus_1 = require("colyseus");
const types_1 = require("@shared/types");
const movement_1 = require("../systems/movement");
class BaseRoom extends colyseus_1.Room {
    movementSystem;
    tickRate;
    constructor() {
        super();
        this.tickRate = parseInt(process.env.TICK_RATE || '60');
        this.movementSystem = new movement_1.MovementSystem({
            bound: parseInt(process.env.WORLD_BOUNDS || '20'),
            maxSpeed: 4,
        });
    }
    onCreate(options) {
        this.setState(new types_1.WorldState());
        // Set up tick loop
        this.setSimulationInterval(() => this.update(), 1000 / this.tickRate);
        // Handle client messages
        this.onMessage('input', (client, input) => this.handleInput(client, input));
    }
    onJoin(client, options) {
        console.log(`Client ${client.sessionId} joined room ${this.roomId}`);
        // Create player
        const player = this.createPlayer(client.sessionId, options);
        this.state.players.set(client.sessionId, player);
        // Send initial state
        client.send('state', this.state);
    }
    onLeave(client, consented) {
        console.log(`Client ${client.sessionId} left room ${this.roomId}`);
        // Remove player
        this.state.players.delete(client.sessionId);
    }
    onDispose() {
        console.log(`Room ${this.roomId} disposed`);
    }
    update() {
        // Update movement for all players
        this.state.players.forEach((player) => {
            this.movementSystem.step(1 / this.tickRate, player);
        });
        // Update timestamp
        this.state.timestamp = Date.now();
    }
    handleInput(client, input) {
        const player = this.state.players.get(client.sessionId);
        if (!player)
            return;
        // Update player velocity based on input
        const speed = 2.0;
        player.vel.vx = 0;
        player.vel.vz = 0;
        if (input.up)
            player.vel.vz = -speed;
        if (input.down)
            player.vel.vz = speed;
        if (input.left)
            player.vel.vx = -speed;
        if (input.right)
            player.vel.vx = speed;
        // Update animation
        if (player.vel.vx !== 0 || player.vel.vz !== 0) {
            player.anim = 'walk';
        }
        else {
            player.anim = 'idle';
        }
    }
}
exports.BaseRoom = BaseRoom;
//# sourceMappingURL=base-room.js.map