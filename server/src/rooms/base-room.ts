import { Room, Client } from 'colyseus';
import { WorldState, Player, Entity, Drop } from '@shared/types';
import { MovementSystem } from '../systems/movement.js';
import { ZoneService } from '../services/zone-service.js';
import { RoomTransferService } from '../services/room-transfer-service.js';

export abstract class BaseRoom extends Room<WorldState> {
  protected movementSystem: MovementSystem;
  protected tickRate: number;
  protected zoneService: ZoneService;
  protected transferService: RoomTransferService;

  constructor() {
    super();
    this.tickRate = parseInt(process.env.TICK_RATE || '60');
    this.movementSystem = new MovementSystem({
      bound: parseInt(process.env.WORLD_BOUNDS || '20'),
      maxSpeed: 4,
    });
    this.zoneService = new ZoneService();
    this.transferService = new RoomTransferService(this.zoneService);
    this.initializeZones();
  }

  onCreate(options: any) {
    this.setState(new WorldState());
    
    // Set up tick loop
    this.setSimulationInterval(() => this.update(), 1000 / this.tickRate);
    
    // Handle client messages
    this.onMessage('input', (client, input) => this.handleInput(client, input));
    this.onMessage('swap_zone', (client, data) => this.handleZoneSwap(client, data));
  }

  onJoin(client: Client, options: any) {
    console.log(`Client ${client.sessionId} joined room ${this.roomId}`);
    
    // Create player
    const player = this.createPlayer(client.sessionId, options);
    this.state.players.set(client.sessionId, player);
    
    // Send initial state
    client.send('state', this.state);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`Client ${client.sessionId} left room ${this.roomId}`);
    
    // Remove player
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log(`Room ${this.roomId} disposed`);
  }

  protected abstract createPlayer(sessionId: string, options: any): Player;

  protected initializeZones(): void {
    // This will be implemented by specific room types
  }

  protected update(): void {
    // Update movement for all players
    this.state.players.forEach((player) => {
      this.movementSystem.step(1 / this.tickRate, player);
    });
    
    // Update timestamp
    this.state.timestamp = Date.now();
  }

  protected handleInput(client: Client, input: any): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    // Update player velocity based on input
    const speed = 2.0;
    player.vel.vx = 0;
    player.vel.vz = 0;

    if (input.up) player.vel.vz = -speed;
    if (input.down) player.vel.vz = speed;
    if (input.left) player.vel.vx = -speed;
    if (input.right) player.vel.vx = speed;

    // Update animation
    if (player.vel.vx !== 0 || player.vel.vz !== 0) {
      player.anim = 'walk';
    } else {
      player.anim = 'idle';
    }
  }

  protected handleZoneSwap(client: Client, data: { toZoneId: string }): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    // Validate transfer request
    const validation = this.transferService.validateTransferRequest(
      this.roomId,
      data.toZoneId,
      player,
      2.0, // max door distance
      [] // completed quests (would come from player data in real implementation)
    );

    if (!validation.valid) {
      client.send('zone_swap_error', { reason: validation.reason });
      return;
    }

    // Get spawn position for target zone
    const spawnPos = this.transferService.getSpawnPositionForZone(data.toZoneId);
    if (!spawnPos) {
      client.send('zone_swap_error', { reason: 'No spawn point available' });
      return;
    }

    // Create transfer payload
    const payload = this.transferService.createTransferPayload(player, spawnPos);

    // Send transfer instruction to client
    client.send('zone_transfer', {
      targetZone: data.toZoneId,
      payload,
    });

    // Remove player from current room
    this.state.players.delete(client.sessionId);
  }
}
