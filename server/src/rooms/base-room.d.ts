import { Room, Client } from 'colyseus';
import { WorldState, Player } from '@shared/types';
import { MovementSystem } from '../systems/movement';
export declare abstract class BaseRoom extends Room<WorldState> {
    protected movementSystem: MovementSystem;
    protected tickRate: number;
    constructor();
    onCreate(options: any): void;
    onJoin(client: Client, options: any): void;
    onLeave(client: Client, consented: boolean): void;
    onDispose(): void;
    protected abstract createPlayer(sessionId: string, options: any): Player;
    protected update(): void;
    protected handleInput(client: Client, input: any): void;
}
//# sourceMappingURL=base-room.d.ts.map