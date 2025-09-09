import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import { WorldState, Player, Entity, Drop } from './shared/types.js';
import { MovementSystem } from './systems/movement.js';
import { ZoneService } from './services/zone-service.js';
import { RoomTransferService } from './services/room-transfer-service.js';
import { CommandParser, ParsedCommand } from './systems/command-parser.js';
import { CombatSystem } from './systems/combat.js';
import { EntitySystem } from './systems/entity.js';
import { AISystem } from './systems/ai.js';
import { LootSystem } from './systems/loot.js';
import { InventorySystem } from './systems/inventory.js';
import { VendorSystem } from './systems/vendor.js';
import { QuestSystem } from './systems/quest.js';
import { PetSystem } from './systems/pet.js';

export class SocketGameServer {
  private io: SocketIOServer;
  private app: express.Application;
  private server: any;
  private rooms: Map<string, GameRoom> = new Map();
  private tickRate: number;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    this.tickRate = parseInt(process.env.TICK_RATE || '60');
    
    this.setupRoutes();
    this.setupSocketHandlers();
    this.startGameLoop();
  }

  private setupRoutes(): void {
    // Serve static files
    this.app.use(express.static('../client/dist'));
    
    // Health check
    this.app.get('/healthz', (req, res) => {
      res.send('OK');
    });
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client ${socket.id} connected`);
      
      socket.on('join_room', (data: { roomName: string; playerName: string; playerClass: string }) => {
        this.handleJoinRoom(socket, data);
      });
      
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
      
      socket.on('command', (data: { text: string }) => {
        this.handleCommand(socket, data);
      });
    });
  }

  private handleJoinRoom(socket: any, data: { roomName: string; playerName: string; playerClass: string }): void {
    const roomName = data.roomName || 'world_hub';
    
    // Get or create room
    let room = this.rooms.get(roomName);
    if (!room) {
      room = new GameRoom(roomName, this.io);
      this.rooms.set(roomName, room);
    }
    
    // Join the room
    socket.join(roomName);
    
    // Add player to room
    const player = room.addPlayer(socket.id, data.playerName, data.playerClass);
    
    // Send initial state to the player
    socket.emit('state', room.getState());
    
    // Notify other players in the room
    socket.to(roomName).emit('player_joined', {
      playerId: socket.id,
      playerName: player.name,
      playerClass: player.class
    });
    
    // Send welcome message
    socket.emit('message', { 
      text: `Welcome to Last-Lite, ${player.name}! You're in the ${roomName} world. Type 'help' for commands.` 
    });
    
    console.log(`Player ${player.name} joined room ${roomName}`);
  }

  private handleDisconnect(socket: any): void {
    console.log(`Client ${socket.id} disconnected`);
    
    // Find which room the player was in and remove them
    for (const [roomName, room] of this.rooms) {
      if (room.hasPlayer(socket.id)) {
        room.removePlayer(socket.id);
        
        // Notify other players in the room
        socket.to(roomName).emit('player_left', { playerId: socket.id });
        
        // Clean up empty rooms
        if (room.isEmpty()) {
          this.rooms.delete(roomName);
          console.log(`Room ${roomName} cleaned up`);
        }
        break;
      }
    }
  }

  private handleCommand(socket: any, data: { text: string }): void {
    // Find which room the player is in
    for (const [roomName, room] of this.rooms) {
      if (room.hasPlayer(socket.id)) {
        room.handleCommand(socket.id, data.text);
        break;
      }
    }
  }

  private startGameLoop(): void {
    setInterval(() => {
      const deltaTime = 1 / this.tickRate;
      
      // Update all rooms
      for (const room of this.rooms.values()) {
        room.update(deltaTime);
      }
    }, 1000 / this.tickRate);
  }

  public start(port: number = 3000): void {
    this.server.listen(port, () => {
      console.log(`🚀 Socket.io server running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/healthz`);
    });
  }
}

class GameRoom {
  private name: string;
  private io: SocketIOServer;
  private state: WorldState;
  private players: Map<string, Player> = new Map();
  private systems: {
    movement: MovementSystem;
    combat: CombatSystem;
    entity: EntitySystem;
    ai: AISystem;
    loot: LootSystem;
    inventory: InventorySystem;
    vendor: VendorSystem;
    quest: QuestSystem;
    pet: PetSystem;
    commandParser: CommandParser;
  };

  constructor(name: string, io: SocketIOServer) {
    this.name = name;
    this.io = io;
    this.state = new WorldState();
    
    // Initialize systems
    this.systems = {
      movement: new MovementSystem({
        bound: parseInt(process.env.WORLD_BOUNDS || '20'),
        maxSpeed: 4,
      }),
      combat: new CombatSystem(),
      entity: new EntitySystem(),
      ai: new AISystem(),
      loot: new LootSystem(),
      inventory: new InventorySystem(),
      vendor: new VendorSystem(),
      quest: new QuestSystem(),
      pet: new PetSystem(),
      commandParser: new CommandParser()
    };
    
    this.initializeRoom();
  }

  private initializeRoom(): void {
    // Initialize room-specific content
    if (this.name === 'world_hub') {
      // Hub-specific initialization
    } else if (this.name.startsWith('world_field_')) {
      // Field-specific initialization
      this.spawnFieldMobs();
    }
  }

  private spawnFieldMobs(): void {
    // Spawn some mobs in the field
    this.systems.entity.spawnEntity({
      id: 'boarling-1',
      name: 'Boarling',
      type: 'mob' as any,
      pos: { x: 5, y: 0, z: 5 },
      level: 2,
      hp: 50,
      maxHp: 50,
      spawnPos: { x: 5, y: 0, z: 5 },
      leashDistance: 8
    });
  }

  public addPlayer(socketId: string, name: string, playerClass: string): Player {
    const player: Player = {
      id: socketId,
      name: name || `Player_${socketId.slice(0, 8)}`,
      class: playerClass as any || 'Warrior',
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
      debuffs: [],
      lastGcd: 0,
      abilityCooldowns: {},
      inventory: [],
      lastActivity: Date.now(),
    };
    
    this.players.set(socketId, player);
    this.state.players[socketId] = player;
    
    return player;
  }

  public removePlayer(socketId: string): void {
    this.players.delete(socketId);
    delete this.state.players[socketId];
  }

  public hasPlayer(socketId: string): boolean {
    return this.players.has(socketId);
  }

  public isEmpty(): boolean {
    return this.players.size === 0;
  }

  public handleCommand(socketId: string, text: string): void {
    const player = this.players.get(socketId);
    if (!player) return;

    const parsed = this.systems.commandParser.parse(text);
    
    switch (parsed.type) {
      case 'move':
        this.handleMoveCommand(player, parsed);
        break;
      case 'say':
        this.handleSayCommand(player, parsed);
        break;
      case 'attack':
        this.handleAttackCommand(player, parsed);
        break;
      case 'party':
        this.handlePartyCommand(player, parsed, socketId);
        break;
      case 'dungeon':
        this.handleDungeonCommand(player, parsed, socketId);
        break;
      case 'inventory':
        this.handleInventoryCommand(player, socketId);
        break;
      case 'help':
        this.handleHelpCommand(socketId);
        break;
      default:
        this.io.to(socketId).emit('message', { text: 'Unknown command. Type "help" for available commands.' });
    }
  }

  private handleMoveCommand(player: Player, parsed: ParsedCommand): void {
    if (parsed.direction) {
      // Set velocity based on direction
      const speed = 2;
      switch (parsed.direction) {
        case 'north':
          player.vel.vz = -speed;
          break;
        case 'south':
          player.vel.vz = speed;
          break;
        case 'east':
          player.vel.vx = speed;
          break;
        case 'west':
          player.vel.vx = -speed;
          break;
      }
      this.broadcastState();
    }
  }

  private handleSayCommand(player: Player, parsed: ParsedCommand): void {
    if (parsed.message) {
      const message = `${player.name}: ${parsed.message}`;
      this.io.to(this.name).emit('message', { text: message });
    }
  }

  private handleAttackCommand(player: Player, parsed: ParsedCommand): void {
    if (parsed.target) {
      const target = this.findEntityByName(parsed.target);
      if (target) {
        // Create a basic attack ability
        const attackAbility = {
          id: 'basic_attack',
          class: player.class,
          power: 10,
          cost: 0,
          cd: 0,
          gcd: 1,
          range: 5,
          type: 'damage' as any
        };
        
        const combatResult = this.systems.combat.tryCast(player, attackAbility, target);
        if (combatResult.success) {
          const damage = combatResult.damage || 0;
          this.io.to(player.id).emit('message', { text: `You attack ${target.name} for ${damage} damage!` });
          this.broadcastState();
        } else {
          this.io.to(player.id).emit('message', { text: `Cannot attack: ${combatResult.reason}` });
        }
      } else {
        this.io.to(player.id).emit('message', { text: `No target named "${parsed.target}" found.` });
      }
    }
  }

  private handlePartyCommand(player: Player, parsed: ParsedCommand, socketId: string): void {
    const action = parsed.action;
    
    switch (action) {
      case 'create':
        this.io.to(socketId).emit('message', { text: 'Party created! Use "party invite <name>" to invite players.' });
        break;
      case 'invite':
        if (parsed.target) {
          this.io.to(socketId).emit('message', { text: `Invited ${parsed.target} to your party!` });
        } else {
          this.io.to(socketId).emit('message', { text: 'Usage: party invite <player name>' });
        }
        break;
      case 'join':
        if (parsed.target) {
          this.io.to(socketId).emit('message', { text: `Joined ${parsed.target}'s party!` });
        } else {
          this.io.to(socketId).emit('message', { text: 'Usage: party join <party name>' });
        }
        break;
      case 'leave':
        this.io.to(socketId).emit('message', { text: 'Left the party.' });
        break;
      case 'list':
        this.io.to(socketId).emit('message', { text: 'Available parties: None (create one with "party create")' });
        break;
      default:
        this.io.to(socketId).emit('message', { text: 'Party commands: create, invite <name>, join <name>, leave, list' });
    }
  }

  private handleDungeonCommand(player: Player, parsed: ParsedCommand, socketId: string): void {
    const action = parsed.action;
    
    switch (action) {
      case 'list':
        this.io.to(socketId).emit('message', { text: 'Available dungeons: Goblin Cave (requires party of 2+)' });
        break;
      case 'enter':
        if (parsed.target) {
          this.io.to(socketId).emit('message', { text: `Entering ${parsed.target}... (Feature coming soon!)` });
        } else {
          this.io.to(socketId).emit('message', { text: 'Usage: dungeon enter <dungeon name>' });
        }
        break;
      default:
        this.io.to(socketId).emit('message', { text: 'Dungeon commands: list, enter <name>' });
    }
  }

  private handleInventoryCommand(player: Player, socketId: string): void {
    const inventory = player.inventory || [];
    if (inventory.length === 0) {
      this.io.to(socketId).emit('message', { text: 'Your inventory is empty.' });
    } else {
      const items = inventory.map((item, index) => `${index + 1}. ${item.name} (${item.quantity})`).join('\n');
      this.io.to(socketId).emit('message', { text: `Your inventory:\n${items}` });
    }
  }

  private handleHelpCommand(socketId: string): void {
    const helpText = `
🎮 Last-Lite MMO Commands:

🌍 Movement:
- move <direction> - Move north, south, east, or west
- say <message> - Chat with other players

⚔️ Combat:
- attack <target> - Attack a monster or player

👥 Party System:
- party create - Create a new party
- party invite <name> - Invite a player to your party
- party join <name> - Join an existing party
- party leave - Leave your current party
- party list - List available parties

🏰 Dungeons:
- dungeon list - Show available dungeons
- dungeon enter <name> - Enter a dungeon (requires party)

🎒 Other:
- inventory - View your items
- help - Show this help message

💡 This is a shared world - you'll see other players!
    `;
    this.io.to(socketId).emit('message', { text: helpText });
  }

  private findEntityByName(name: string): Entity | null {
    const entities = this.systems.entity.findEntitiesByName(name);
    return entities.length > 0 ? entities[0] : null;
  }

  public update(deltaTime: number): void {
    // Update movement for all players
    for (const player of this.players.values()) {
      this.systems.movement.step(deltaTime, player);
    }

    // Update AI for all entities
    const entities = this.systems.entity.getAllEntities();
    this.systems.ai.update(entities, this.players, deltaTime);
    
    // Update timestamp
    this.state.timestamp = Date.now();
    
    // Broadcast state to all players in the room
    this.broadcastState();
  }

  private broadcastState(): void {
    this.io.to(this.name).emit('state', this.getState());
  }

  public getState(): any {
    return {
      players: this.state.players,
      entities: this.state.entities,
      drops: this.state.drops,
      timestamp: this.state.timestamp
    };
  }
}
