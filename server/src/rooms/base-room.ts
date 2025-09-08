import { Room, Client } from 'colyseus';
import { WorldState, Player, Entity, Drop } from '../shared/types';
import { MovementSystem } from '../systems/movement.js';
import { ZoneService } from '../services/zone-service.js';
import { RoomTransferService } from '../services/room-transfer-service.js';
import { CommandParser, ParsedCommand } from '../systems/command-parser.js';
import { FeedSystem } from '../systems/feed-system.js';

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
    this.onMessage('cmd', (client, data) => this.handleCommand(client, data));
    this.onMessage('hotkey', (client, data) => this.handleHotkey(client, data));
    this.onMessage('swap_zone', (client, data) => this.handleZoneSwap(client, data));
  }

  onJoin(client: Client, options: any) {
    console.log(`Client ${client.sessionId} joined room ${this.roomId}`);
    
    // Create player
    const player = this.createPlayer(client.sessionId, options);
    this.state.players.set(client.sessionId, player);
    
    // Send welcome message
    FeedSystem.sendInfo(client, `Welcome to ${this.roomId}, ${player.name}!`, this.roomId);
    FeedSystem.sendInfo(client, 'Type "help" for available commands.', this.roomId);
    
    // Notify other players
    this.clients.forEach(otherClient => {
      if (otherClient.sessionId !== client.sessionId) {
        FeedSystem.sendInfo(otherClient, `${player.name} enters the area.`, this.roomId);
      }
    });
    
    // Send initial state
    client.send('state', this.state);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`Client ${client.sessionId} left room ${this.roomId}`);
    
    const player = this.state.players.get(client.sessionId);
    
    // Notify other players
    if (player) {
      this.clients.forEach(otherClient => {
        if (otherClient.sessionId !== client.sessionId) {
          FeedSystem.sendInfo(otherClient, `${player.name} leaves the area.`, this.roomId);
        }
      });
    }
    
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

  protected handleCommand(client: Client, data: { text: string }): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    const parsedCommand = CommandParser.parse(data.text);
    
    switch (parsedCommand.type) {
      case 'move':
        this.handleMoveCommand(client, player, parsedCommand);
        break;
      case 'attack':
        this.handleAttackCommand(client, player, parsedCommand);
        break;
      case 'cast':
        this.handleCastCommand(client, player, parsedCommand);
        break;
      case 'say':
        this.handleSayCommand(client, player, parsedCommand);
        break;
      case 'look':
        this.handleLookCommand(client, player, parsedCommand);
        break;
      case 'loot':
        this.handleLootCommand(client, player, parsedCommand);
        break;
      case 'help':
        this.handleHelpCommand(client, player, parsedCommand);
        break;
      case 'invalid':
        FeedSystem.sendError(client, parsedCommand.message || 'Invalid command.', this.roomId);
        break;
    }
  }

  protected handleHotkey(client: Client, data: { id: string }): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    // Map hotkey to ability command
    const abilityCommands = {
      '1': 'cast strike',
      '2': 'cast block', 
      '3': 'cast charge',
      '4': 'cast whirlwind'
    };

    const command = abilityCommands[data.id as keyof typeof abilityCommands];
    if (command) {
      this.handleCommand(client, { text: command });
    }
  }

  protected handleMoveCommand(client: Client, player: Player, command: ParsedCommand): void {
    if (!command.direction) return;

    // Simple tile-based movement for text mode
    const moveDistance = 1;
    let newX = player.pos.x;
    let newZ = player.pos.z;

    switch (command.direction) {
      case 'north':
        newZ -= moveDistance;
        break;
      case 'south':
        newZ += moveDistance;
        break;
      case 'east':
        newX += moveDistance;
        break;
      case 'west':
        newX -= moveDistance;
        break;
    }

    // Check bounds (simple for now)
    const bounds = parseInt(process.env.WORLD_BOUNDS || '20');
    if (Math.abs(newX) > bounds || Math.abs(newZ) > bounds) {
      FeedSystem.sendError(client, 'You cannot go that way.', this.roomId);
      return;
    }

    // Update position
    player.pos.x = newX;
    player.pos.z = newZ;

    FeedSystem.sendInfo(client, `You move ${command.direction}.`, this.roomId);
    FeedSystem.sendInfoToRoom(this, `${player.name} moves ${command.direction}.`, this.roomId);
  }

  protected handleAttackCommand(client: Client, player: Player, command: ParsedCommand): void {
    if (!command.target) return;

    FeedSystem.sendCombat(client, `You attack ${command.target}.`, this.roomId);
    FeedSystem.sendCombatToRoom(this, `${player.name} attacks ${command.target}.`, this.roomId);
  }

  protected handleCastCommand(client: Client, player: Player, command: ParsedCommand): void {
    if (!command.ability) return;

    const targetText = command.target ? ` at ${command.target}` : '';
    FeedSystem.sendCombat(client, `You cast ${command.ability}${targetText}.`, this.roomId);
    FeedSystem.sendCombatToRoom(this, `${player.name} casts ${command.ability}${targetText}.`, this.roomId);
  }

  protected handleSayCommand(client: Client, player: Player, command: ParsedCommand): void {
    if (!command.message) return;

    FeedSystem.sendInfoToRoom(this, `${player.name} says: "${command.message}"`, this.roomId);
  }

  protected handleLookCommand(client: Client, player: Player, command: ParsedCommand): void {
    const zone = this.zoneService.getZone(this.roomId);
    const zoneName = zone ? zone.name : this.roomId;
    
    FeedSystem.sendInfo(client, `You are in ${zoneName}.`, this.roomId);
    FeedSystem.sendInfo(client, `Position: (${Math.round(player.pos.x)}, ${Math.round(player.pos.z)})`, this.roomId);
    FeedSystem.sendInfo(client, `Players nearby: ${this.state.players.size}`, this.roomId);
  }

  protected handleLootCommand(client: Client, player: Player, command: ParsedCommand): void {
    FeedSystem.sendLoot(client, 'You look for items to loot...', this.roomId);
  }

  protected handleHelpCommand(client: Client, player: Player, command: ParsedCommand): void {
    const helpText = CommandParser.getHelpText();
    FeedSystem.sendInfo(client, helpText, this.roomId);
  }
}
