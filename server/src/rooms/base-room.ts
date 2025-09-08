import { Room, Client } from 'colyseus';
import { WorldState, Player, Entity, Drop } from '../shared/types';
import { MovementSystem } from '../systems/movement.js';
import { ZoneService } from '../services/zone-service.js';
import { RoomTransferService } from '../services/room-transfer-service.js';
import { CommandParser, ParsedCommand } from '../systems/command-parser.js';

export abstract class BaseRoom extends Room<WorldState> {
  protected movementSystem: MovementSystem;
  protected tickRate: number;
  protected zoneService: ZoneService;
  protected transferService: RoomTransferService;
  protected commandParser: CommandParser;

  constructor() {
    super();
    this.tickRate = parseInt(process.env.TICK_RATE || '60');
    this.movementSystem = new MovementSystem({
      bound: parseInt(process.env.WORLD_BOUNDS || '20'),
      maxSpeed: 4,
    });
    this.zoneService = new ZoneService();
    this.transferService = new RoomTransferService(this.zoneService);
    this.commandParser = new CommandParser();
    this.initializeZones();
  }

  onCreate(options: any) {
    this.setState(new WorldState());
    
    // Set up tick loop
    this.setSimulationInterval(() => this.update(), 1000 / this.tickRate);
    
    // Handle client messages
    this.onMessage('cmd', (client, data) => this.handleCommand(client, data));
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

  protected handleCommand(client: Client, data: { text: string }): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    const parsed = this.commandParser.parse(data.text);
    
    switch (parsed.type) {
      case 'move':
        this.handleMoveCommand(client, parsed);
        break;
      case 'attack':
        this.handleAttackCommand(client, parsed);
        break;
      case 'cast':
        this.handleCastCommand(client, parsed);
        break;
      case 'loot':
        this.handleLootCommand(client);
        break;
      case 'look':
        this.handleLookCommand(client);
        break;
      case 'say':
        this.handleSayCommand(client, parsed);
        break;
      case 'error':
        this.sendFeedEntry(client, {
          at: Date.now(),
          text: parsed.message || 'Unknown error',
          type: 'error'
        });
        break;
    }
  }

  protected handleMoveCommand(client: Client, parsed: ParsedCommand): void {
    const player = this.state.players.get(client.sessionId);
    if (!player || !parsed.direction) return;

    // Simple tile-based movement
    const tileSize = 1;
    switch (parsed.direction) {
      case 'north':
        player.pos.z -= tileSize;
        break;
      case 'south':
        player.pos.z += tileSize;
        break;
      case 'east':
        player.pos.x += tileSize;
        break;
      case 'west':
        player.pos.x -= tileSize;
        break;
    }

    // Check bounds
    const bounds = parseInt(process.env.WORLD_BOUNDS || '20');
    if (Math.abs(player.pos.x) > bounds || Math.abs(player.pos.z) > bounds) {
      // Revert movement
      switch (parsed.direction) {
        case 'north':
          player.pos.z += tileSize;
          break;
        case 'south':
          player.pos.z -= tileSize;
          break;
        case 'east':
          player.pos.x -= tileSize;
          break;
        case 'west':
          player.pos.x += tileSize;
          break;
      }
      
      this.sendFeedEntry(client, {
        at: Date.now(),
        text: 'You cannot go that way.',
        type: 'error'
      });
      return;
    }

    this.sendFeedEntry(client, {
      at: Date.now(),
      text: `You move ${parsed.direction}.`,
      type: 'info'
    });
  }

  protected handleAttackCommand(client: Client, parsed: ParsedCommand): void {
    this.sendFeedEntry(client, {
      at: Date.now(),
      text: `You attack ${parsed.target}. (Combat system not implemented yet)`,
      type: 'combat'
    });
  }

  protected handleCastCommand(client: Client, parsed: ParsedCommand): void {
    const target = parsed.target ? ` on ${parsed.target}` : '';
    this.sendFeedEntry(client, {
      at: Date.now(),
      text: `You cast ${parsed.ability}${target}. (Combat system not implemented yet)`,
      type: 'combat'
    });
  }

  protected handleLootCommand(client: Client): void {
    this.sendFeedEntry(client, {
      at: Date.now(),
      text: 'Nothing to loot here.',
      type: 'info'
    });
  }

  protected handleLookCommand(client: Client): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    this.sendFeedEntry(client, {
      at: Date.now(),
      text: `You are in ${this.roomId}. Position: (${Math.round(player.pos.x)}, ${Math.round(player.pos.z)})`,
      type: 'info'
    });
  }

  protected handleSayCommand(client: Client, parsed: ParsedCommand): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    // Broadcast to all players in the room
    this.broadcast('feed', [{
      at: Date.now(),
      text: `${player.name} says: ${parsed.message}`,
      type: 'info'
    }]);
  }

  protected sendFeedEntry(client: Client, entry: any): void {
    client.send('feed', [entry]);
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
