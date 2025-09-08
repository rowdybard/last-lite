import { Player } from '@shared/types';
export interface MovementConfig {
    bound: number;
    maxSpeed: number;
    friction?: number;
}
export declare class MovementSystem {
    private config;
    constructor(config: MovementConfig);
    step(deltaTime: number, player: Player): void;
}
//# sourceMappingURL=movement.d.ts.map