"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HubRoom = void 0;
const base_room_1 = require("./base-room");
const types_1 = require("@shared/types");
class HubRoom extends base_room_1.BaseRoom {
    createPlayer(sessionId, options) {
        return {
            id: sessionId,
            name: options.name || `Player_${sessionId.slice(0, 8)}`,
            class: options.class || types_1.CharacterClass.Warrior,
            level: 1,
            xp: 0,
            pos: { x: 0, y: 0, z: 0 },
            vel: { vx: 0, vz: 0 },
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
    }
}
exports.HubRoom = HubRoom;
//# sourceMappingURL=hub-room.js.map