"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const movement_js_1 = require("../src/systems/movement.js");
(0, vitest_1.describe)('MovementSystem', () => {
    (0, vitest_1.it)('should clamp speed and world bounds', () => {
        const system = new movement_js_1.MovementSystem({ bound: 20, maxSpeed: 4 });
        const player = {
            id: 'test-player',
            name: 'TestPlayer',
            class: 'Warrior',
            level: 1,
            xp: 0,
            pos: { x: 19.9, y: 0, z: 0 },
            vel: { vx: 10, vz: 0 },
            dir: 0,
            anim: 'idle',
            hp: 100,
            maxHp: 100,
            mp: 50,
            maxMp: 50,
            gold: 0,
            buffs: [],
            lastGcd: 0,
            abilityCooldowns: new Map(),
        };
        system.step(0.016, player);
        (0, vitest_1.expect)(player.pos.x).toBeLessThanOrEqual(20);
        (0, vitest_1.expect)(Math.hypot(player.vel.vx, player.vel.vz)).toBeLessThanOrEqual(4);
    });
    (0, vitest_1.it)('should apply friction to velocity', () => {
        const system = new movement_js_1.MovementSystem({ bound: 20, maxSpeed: 4, friction: 0.9 });
        const player = {
            id: 'test-player',
            name: 'TestPlayer',
            class: 'Warrior',
            level: 1,
            xp: 0,
            pos: { x: 0, y: 0, z: 0 },
            vel: { vx: 2, vz: 2 },
            dir: 0,
            anim: 'idle',
            hp: 100,
            maxHp: 100,
            mp: 50,
            maxMp: 50,
            gold: 0,
            buffs: [],
            lastGcd: 0,
            abilityCooldowns: new Map(),
        };
        const initialSpeed = Math.hypot(player.vel.vx, player.vel.vz);
        system.step(0.016, player);
        const finalSpeed = Math.hypot(player.vel.vx, player.vel.vz);
        (0, vitest_1.expect)(finalSpeed).toBeLessThan(initialSpeed);
    });
    (0, vitest_1.it)('should update position based on velocity', () => {
        const system = new movement_js_1.MovementSystem({ bound: 20, maxSpeed: 4 });
        const player = {
            id: 'test-player',
            name: 'TestPlayer',
            class: 'Warrior',
            level: 1,
            xp: 0,
            pos: { x: 0, y: 0, z: 0 },
            vel: { vx: 1, vz: 1 },
            dir: 0,
            anim: 'idle',
            hp: 100,
            maxHp: 100,
            mp: 50,
            maxMp: 50,
            gold: 0,
            buffs: [],
            lastGcd: 0,
            abilityCooldowns: new Map(),
        };
        const initialX = player.pos.x;
        const initialZ = player.pos.z;
        system.step(0.016, player);
        (0, vitest_1.expect)(player.pos.x).toBeGreaterThan(initialX);
        (0, vitest_1.expect)(player.pos.z).toBeGreaterThan(initialZ);
    });
});
//# sourceMappingURL=movement.test.js.map