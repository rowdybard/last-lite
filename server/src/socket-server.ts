import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import path from 'path';
import { WorldState, Player, Entity, Drop } from './shared/types.js';
import { UserService } from './services/user-service.js';
import { DatabaseConnection } from './database/config.js';
import { MovementSystem } from './systems/movement.js';
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
  private userService: UserService;
  private parties: Map<string, any> = new Map();
  private userSockets: Map<string, any> = new Map();

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
    this.userService = new UserService();
    
    this.initializeDatabase();
    this.setupRoutes();
    this.setupSocketHandlers();
    this.startGameLoop();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      const db = DatabaseConnection.getInstance();
      const isConnected = await db.testConnection();
      if (isConnected) {
        console.log('✅ Database connection established');
        
        // Check if users table exists, if not create it
        await this.ensureUsersTable();
      } else {
        console.log('❌ Database connection failed');
      }
    } catch (error) {
      console.error('Database initialization error:', error);
    }
  }

  private async ensureUsersTable(): Promise<void> {
    try {
      // Check if users table exists
      const result = await this.userService.db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      `);
      
      if (result.rows.length === 0) {
        console.log('📋 Creating users table...');
        await this.userService.db.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            character_name VARCHAR(50) UNIQUE NOT NULL,
            character_class VARCHAR(20) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        // Create trigger for updated_at
        await this.userService.db.query(`
          CREATE OR REPLACE FUNCTION update_users_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
          END;
          $$ language 'plpgsql';
        `);
        
        await this.userService.db.query(`
          DROP TRIGGER IF EXISTS update_users_updated_at ON users;
          CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_users_updated_at();
        `);
        
        console.log('✅ Users table created successfully');
      } else {
        console.log('✅ Users table already exists');
      }
    } catch (error) {
      console.error('Error ensuring users table:', error);
    }
  }

  private getEmbeddedHomepageHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Last-Lite MMO - Home</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; min-height: 100vh; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; padding: 20px; background: rgba(255, 255, 255, 0.1); border-radius: 15px; }
        .form-container { background: rgba(0, 0, 0, 0.3); border-radius: 10px; padding: 30px; margin: 20px 0; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
        .form-group input { width: 100%; padding: 10px; border: none; border-radius: 5px; background: rgba(255, 255, 255, 0.1); color: white; }
        .btn { padding: 12px 24px; border: none; border-radius: 5px; background: #4CAF50; color: white; cursor: pointer; font-size: 16px; margin: 5px; }
        .btn:hover { background: #45a049; }
        .btn-secondary { background: #2196F3; }
        .btn-secondary:hover { background: #1976D2; }
        .error { background: #ff4444; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .success { background: #4CAF50; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .hidden { display: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Last-Lite MMO</h1>
            <p>Text-Based Adventure Game</p>
        </div>
        
        <div id="login-form" class="form-container">
            <h2>Login</h2>
            <div class="form-group">
                <label for="username">Username:</label>
                <input type="text" id="username" placeholder="Enter your username">
            </div>
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" placeholder="Enter your password">
            </div>
            <button class="btn" onclick="login()">Login</button>
            <button class="btn btn-secondary" onclick="showRegister()">Create Account</button>
        </div>
        
        <div id="register-form" class="form-container hidden">
            <h2>Create Account</h2>
            <div class="form-group">
                <label for="reg-username">Username:</label>
                <input type="text" id="reg-username" placeholder="Choose a username">
            </div>
            <div class="form-group">
                <label for="reg-password">Password:</label>
                <input type="password" id="reg-password" placeholder="Choose a password">
            </div>
            <div class="form-group">
                <label for="reg-confirm">Confirm Password:</label>
                <input type="password" id="reg-confirm" placeholder="Confirm your password">
            </div>
            <div class="form-group">
                <label for="character-name">Character Name:</label>
                <input type="text" id="character-name" placeholder="Choose a character name">
            </div>
            <button class="btn" onclick="register()">Create Account</button>
            <button class="btn btn-secondary" onclick="showLogin()">Back to Login</button>
        </div>
        
        <div id="user-info" class="form-container hidden">
            <h2>Welcome, <span id="current-username"></span>!</h2>
            <p><strong>Character:</strong> <span id="current-character"></span></p>
            <p><strong>Class:</strong> <span id="current-class"></span></p>
            <button class="btn" onclick="enterGame()">Enter Game</button>
            <button class="btn btn-secondary" onclick="logout()">Logout</button>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        let socket = null;
        let currentUser = null;

        function initSocket() {
            socket = io();
            
            socket.on('login_success', (data) => {
                currentUser = data;
                showUserInfo();
            });
            
            socket.on('register_success', (data) => {
                currentUser = data;
                showUserInfo();
            });
            
            socket.on('error', (error) => {
                showError(error);
            });
        }

        function showLogin() {
            document.getElementById('login-form').classList.remove('hidden');
            document.getElementById('register-form').classList.add('hidden');
            document.getElementById('user-info').classList.add('hidden');
        }

        function showRegister() {
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('register-form').classList.remove('hidden');
            document.getElementById('user-info').classList.add('hidden');
        }

        function showUserInfo() {
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('register-form').classList.add('hidden');
            document.getElementById('user-info').classList.remove('hidden');
            
            document.getElementById('current-username').textContent = currentUser.username;
            document.getElementById('current-character').textContent = currentUser.characterName;
            document.getElementById('current-class').textContent = currentUser.characterClass;
        }

        function login() {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (!username || !password) {
                showError('Please fill in all fields');
                return;
            }
            
            socket.emit('login', { username, password });
        }

        function register() {
            const username = document.getElementById('reg-username').value;
            const password = document.getElementById('reg-password').value;
            const confirm = document.getElementById('reg-confirm').value;
            const characterName = document.getElementById('character-name').value;
            
            if (!username || !password || !characterName) {
                showError('Please fill in all fields');
                return;
            }
            
            if (password !== confirm) {
                showError('Passwords do not match');
                return;
            }
            
            socket.emit('register', { username, password, characterName, characterClass: 'Warrior' });
        }

        function enterGame() {
            if (currentUser) {
                const gameUrl = '/game.html?user=' + encodeURIComponent(JSON.stringify(currentUser));
                window.location.href = gameUrl;
            }
        }

        function logout() {
            currentUser = null;
            showLogin();
        }

        function showError(message) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = message;
            document.querySelector('.container').appendChild(errorDiv);
            setTimeout(() => errorDiv.remove(), 5000);
        }

        function showSuccess(message) {
            const successDiv = document.createElement('div');
            successDiv.className = 'success';
            successDiv.textContent = message;
            document.querySelector('.container').appendChild(successDiv);
            setTimeout(() => successDiv.remove(), 5000);
        }

        document.addEventListener('DOMContentLoaded', () => {
            initSocket();
        });
    </script>
</body>
</html>`;
  }

  private getEmbeddedGameHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Last-Lite MMO</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; min-height: 100vh; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; padding: 20px; background: rgba(255, 255, 255, 0.1); border-radius: 15px; }
        .game-layout { display: grid; grid-template-columns: 1fr 300px; gap: 20px; }
        .world-feed { background: rgba(0, 0, 0, 0.3); border-radius: 10px; padding: 20px; min-height: 400px; }
        .sidebar { display: flex; flex-direction: column; gap: 20px; }
        .info-panel, .actions-panel { background: rgba(0, 0, 0, 0.3); border-radius: 10px; padding: 20px; }
        .command-input { width: 100%; padding: 10px; border: none; border-radius: 5px; background: rgba(255, 255, 255, 0.1); color: white; }
        .btn { padding: 10px 20px; border: none; border-radius: 5px; background: #4CAF50; color: white; cursor: pointer; margin: 5px; }
        .btn:hover { background: #45a049; }
        .status { padding: 10px; background: rgba(0, 0, 0, 0.5); border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Last-Lite MMO</h1>
            <p>Text-Based Adventure Game</p>
        </div>
        
        <div class="game-layout">
            <div class="world-feed">
                <h3>World Information</h3>
                <div id="world-feed">
                    <div class="status">Connecting to game server...</div>
                </div>
                
                <div style="margin-top: 20px;">
                    <input type="text" id="command-input" class="command-input" placeholder="Enter command (e.g., 'look', 'move north', 'attack goblin')" onkeypress="handleCommand(event)">
                </div>
            </div>
            
            <div class="sidebar">
                <div class="info-panel">
                    <h3>Player Status</h3>
                    <div id="player-status">
                        <p><strong>Name:</strong> <span id="player-name">Loading...</span></p>
                        <p><strong>Class:</strong> <span id="player-class">Loading...</span></p>
                        <p><strong>Health:</strong> <span id="player-health">Loading...</span></p>
                        <p><strong>Room:</strong> <span id="current-room">Loading...</span></p>
                    </div>
                </div>
                
                <div class="actions-panel">
                    <h3>Quick Actions</h3>
                    <button class="btn" onclick="sendCommand('look')">Look</button>
                    <button class="btn" onclick="sendCommand('inventory')">Inventory</button>
                    <button class="btn" onclick="sendCommand('stats')">Stats</button>
                    <button class="btn" onclick="sendCommand('help')">Help</button>
                </div>
            </div>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        let socket = null;
        let gameState = null;
        let isConnected = false;
        let currentRoom = 'Connecting...';
        let playerName = 'Player';
        let playerClass = 'Adventurer';
        let userData = {};

        // Parse user data from URL
        function parseUserData() {
            const urlParams = new URLSearchParams(window.location.search);
            const userParam = urlParams.get('user');
            if (userParam) {
                try {
                    userData = JSON.parse(decodeURIComponent(userParam));
                    playerName = userData.characterName || 'Player';
                    playerClass = userData.characterClass || 'Adventurer';
                    console.log('User data:', userData);
                } catch (e) {
                    console.error('Failed to parse user data:', e);
                }
            }
        }

        function connect() {
            parseUserData();
            
            // Connect to Socket.io server
            socket = io();
            
            socket.on('connect', () => {
                console.log('Connected to server');
                isConnected = true;
                addToFeed('Connected to game server!', 'system');
                joinGame();
            });
            
            socket.on('disconnect', () => {
                console.log('Disconnected from server');
                isConnected = false;
                addToFeed('Disconnected from server', 'error');
            });
            
            socket.on('game_state', (state) => {
                gameState = state;
                updateUI();
            });
            
            socket.on('message', (data) => {
                addToFeed(data.message, data.type || 'info');
            });
            
            socket.on('error', (error) => {
                addToFeed('Error: ' + error, 'error');
            });
        }

        function joinGame() {
            if (socket && isConnected) {
                socket.emit('join_room', {
                    roomName: 'world_hub',
                    playerName: playerName,
                    playerClass: playerClass
                });
                addToFeed('Joining world...', 'system');
            }
        }

        function sendCommand(command) {
            if (socket && isConnected) {
                socket.emit('command', { command: command });
                addToFeed('> ' + command, 'command');
            } else {
                addToFeed('Not connected to server', 'error');
            }
        }

        function handleCommand(event) {
            if (event.key === 'Enter') {
                const input = document.getElementById('command-input');
                const command = input.value.trim();
                if (command) {
                    sendCommand(command);
                    input.value = '';
                }
            }
        }

        function addToFeed(message, type = 'info') {
            const feed = document.getElementById('world-feed');
            const div = document.createElement('div');
            div.className = 'status';
            div.style.color = type === 'error' ? '#ff6b6b' : type === 'system' ? '#4ecdc4' : type === 'command' ? '#ffe66d' : 'white';
            div.textContent = message;
            feed.appendChild(div);
            feed.scrollTop = feed.scrollHeight;
        }

        function updateUI() {
            if (gameState) {
                document.getElementById('player-name').textContent = playerName;
                document.getElementById('player-class').textContent = playerClass;
                document.getElementById('current-room').textContent = currentRoom;
                
                if (gameState.players && gameState.players[playerName]) {
                    const player = gameState.players[playerName];
                    document.getElementById('player-health').textContent = player.health + '/' + player.maxHealth;
                }
            }
        }

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', () => {
            connect();
        });
    </script>
</body>
</html>`;
  }

  private setupRoutes(): void {
    const clientDistPath = path.join(__dirname, '../../client/dist');
    console.log('Client dist path:', clientDistPath);
    console.log('__dirname:', __dirname);
    console.log('Current working directory:', process.cwd());
    
    // Check if client dist directory exists
    const fs = require('fs');
    if (fs.existsSync(clientDistPath)) {
      console.log('✅ Client dist directory exists');
      const files = fs.readdirSync(clientDistPath);
      console.log('Files in client/dist:', files);
    } else {
      console.log('❌ Client dist directory does not exist!');
      console.log('Trying alternative paths...');
      
      // Try alternative paths
      const altPaths = [
        path.join(process.cwd(), 'client/dist'),
        path.join(process.cwd(), 'src/client/dist'),
        path.join(__dirname, '../../../client/dist'),
        path.join(__dirname, '../../../../client/dist')
      ];
      
      for (const altPath of altPaths) {
        console.log('Checking:', altPath);
        if (fs.existsSync(altPath)) {
          console.log('✅ Found client dist at:', altPath);
          const files = fs.readdirSync(altPath);
          console.log('Files in alternative path:', files);
          break;
        }
      }
    }
    
    // Serve static files
    this.app.use(express.static(clientDistPath));
    
    // Serve homepage
    this.app.get('/', (req, res) => {
      console.log('Serving homepage...');
      const homepagePath = path.join(clientDistPath, 'homepage.html');
      console.log('Homepage path:', homepagePath);
      console.log('Homepage exists:', fs.existsSync(homepagePath));
      
      if (fs.existsSync(homepagePath)) {
        res.sendFile(homepagePath);
      } else {
        console.log('❌ Homepage not found, trying alternative locations...');
        
        // Try alternative locations
        const altPaths = [
          path.join(process.cwd(), 'client/src/homepage.html'),
          path.join(process.cwd(), 'src/client/src/homepage.html'),
          path.join(__dirname, '../../../client/src/homepage.html'),
          path.join(__dirname, '../../../../client/src/homepage.html')
        ];
        
        let found = false;
        for (const altPath of altPaths) {
          console.log('Checking alternative path:', altPath);
          if (fs.existsSync(altPath)) {
            console.log('✅ Found homepage at:', altPath);
            res.sendFile(altPath);
            found = true;
            break;
          }
        }
        
        if (!found) {
          console.log('❌ Homepage not found anywhere, serving embedded homepage');
          const homepageHtml = this.getEmbeddedHomepageHtml();
          res.send(homepageHtml);
        }
      }
    });
    
    // Serve game
    this.app.get('/game.html', (req, res) => {
      console.log('Serving game.html with params:', req.query);
      const gamePath = path.join(clientDistPath, 'polished-game.html');
      console.log('Game path:', gamePath);
      console.log('Game file exists:', fs.existsSync(gamePath));
      
      if (fs.existsSync(gamePath)) {
        res.sendFile(gamePath);
      } else {
        console.log('❌ Game file not found, trying alternative locations...');
        
        // Try alternative locations
        const altPaths = [
          path.join(process.cwd(), 'client/src/polished-game.html'),
          path.join(process.cwd(), 'src/client/src/polished-game.html'),
          path.join(__dirname, '../../../client/src/polished-game.html'),
          path.join(__dirname, '../../../../client/src/polished-game.html')
        ];
        
        let found = false;
        for (const altPath of altPaths) {
          console.log('Checking alternative path:', altPath);
          if (fs.existsSync(altPath)) {
            console.log('✅ Found game file at:', altPath);
            res.sendFile(altPath);
            found = true;
            break;
          }
        }
        
        if (!found) {
          console.log('❌ Game file not found anywhere, serving embedded game HTML');
          // Serve the actual game HTML embedded in the server
          const gameHtml = this.getEmbeddedGameHtml();
          res.send(gameHtml);
        }
      }
    });
    
    // Health check
    this.app.get('/healthz', (req, res) => {
      res.send('OK');
    });
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client ${socket.id} connected`);
      
      // Account management
      socket.on('login', async (data: { username: string; password: string }) => {
        await this.handleLogin(socket, data);
      });
      
      socket.on('register', async (data: { username: string; password: string; characterName: string; characterClass: string }) => {
        await this.handleRegister(socket, data);
      });
      
      // Party management
      socket.on('create_party', (data: { name: string }) => {
        this.handleCreateParty(socket, data);
      });
      
      socket.on('join_party', (data: { name: string }) => {
        this.handleJoinParty(socket, data);
      });
      
      socket.on('leave_party', () => {
        this.handleLeaveParty(socket);
      });
      
      socket.on('invite_to_party', (data: { username: string }) => {
        this.handleInviteToParty(socket, data);
      });
      
      socket.on('get_parties', () => {
        this.handleGetParties(socket);
      });
      
      // Game room management
      socket.on('join_room', (data: { roomName: string; playerName: string; playerClass: string }) => {
        this.handleJoinRoom(socket, data);
      });
      
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
      
      socket.on('command', (data: { command: string }) => {
        this.handleCommand(socket, data);
      });
    });
  }

  private handleJoinRoom(socket: any, data: { roomName: string; playerName: string; playerClass: string }): void {
    console.log(`Handling join_room for socket ${socket.id}:`, data);
    const roomName = data.roomName || 'world_hub';
    
    try {
      // Get or create room
      let room = this.rooms.get(roomName);
      if (!room) {
        console.log(`Creating new room: ${roomName}`);
        room = new GameRoom(roomName, this.io);
        this.rooms.set(roomName, room);
      }
      
      // Join the room
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined room ${roomName}`);
      
      // Add player to room
      const player = room.addPlayer(socket.id, data.playerName, data.playerClass);
      console.log(`Player created:`, player);
      
      // Send initial state to the player
      const gameState = room.getState();
      console.log(`Sending game state to ${socket.id}:`, gameState);
      socket.emit('game_state', gameState);
      
      // Notify other players in the room
      socket.to(roomName).emit('player_joined', {
        playerId: socket.id,
        playerName: player.name,
        playerClass: player.class
      });
      
      // Send welcome message
      socket.emit('message', { 
        message: `Welcome to Last-Lite, ${player.name}! You're in the ${roomName} world. Type 'help' for commands.`,
        type: 'system'
      });
      
      console.log(`Player ${player.name} successfully joined room ${roomName}`);
    } catch (error) {
      console.error(`Error in handleJoinRoom:`, error);
      socket.emit('error', 'Failed to join room: ' + (error instanceof Error ? error.message : String(error)));
    }
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

  private handleCommand(socket: any, data: { command: string }): void {
    console.log(`Handling command from socket ${socket.id}:`, data.command);
    
    // Find which room the player is in
    let found = false;
    for (const [roomName, room] of this.rooms) {
      if (room.hasPlayer(socket.id)) {
        console.log(`Player found in room ${roomName}, processing command`);
        room.handleCommand(socket.id, data.command);
        found = true;
        break;
      }
    }
    
    if (!found) {
      console.log(`Player ${socket.id} not found in any room`);
      socket.emit('message', { message: 'You are not in a room. Please join a room first.', type: 'error' });
    }
  }

  // Account management handlers
  private async handleLogin(socket: any, data: { username: string; password: string }): Promise<void> {
    try {
      const isValid = await this.userService.validatePassword(data.username, data.password);
      if (isValid) {
        const user = await this.userService.getUserByUsername(data.username);
        if (user) {
          this.userSockets.set(data.username, socket);
          socket.emit('login_success', { 
            user: {
              username: user.username, 
              characterName: user.characterName, 
              characterClass: user.characterClass 
            }
          });
        } else {
          socket.emit('error', { message: 'User not found' });
        }
      } else {
        socket.emit('error', { message: 'Invalid username or password' });
      }
    } catch (error) {
      console.error('Login error:', error);
      socket.emit('error', { message: 'Login failed: ' + (error instanceof Error ? error.message : String(error)) });
    }
  }

  private async handleRegister(socket: any, data: { username: string; password: string; characterName: string; characterClass: string }): Promise<void> {
    try {
      // Check if username already exists
      const usernameExists = await this.userService.userExists(data.username);
      if (usernameExists) {
        socket.emit('error', { message: 'Username already exists' });
        return;
      }

      // Check if character name already exists
      const characterNameExists = await this.userService.characterNameExists(data.characterName);
      if (characterNameExists) {
        socket.emit('error', { message: 'Character name already exists' });
        return;
      }

      // Create user in database
      const user = await this.userService.createUser({
        username: data.username,
        password: data.password,
        characterName: data.characterName,
        characterClass: data.characterClass
      });

      socket.emit('register_success', { 
        user: {
          username: user.username,
          characterName: user.characterName,
          characterClass: user.characterClass
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      socket.emit('error', { message: 'Registration failed: ' + (error instanceof Error ? error.message : String(error)) });
    }
  }

  // Party management handlers
  private handleCreateParty(socket: any, data: { name: string }): void {
    const username = this.getUsernameBySocket(socket);
    if (!username) {
      socket.emit('error', { message: 'You must be logged in to create a party' });
      return;
    }

    if (this.parties.has(data.name)) {
      socket.emit('error', { message: 'Party name already exists' });
      return;
    }

    const party = {
      id: data.name,
      name: data.name,
      leader: username,
      members: [{ name: username, status: 'online' }],
      createdAt: Date.now()
    };

    this.parties.set(data.name, party);
    socket.emit('party_created', { party });
    this.broadcastParties();
  }

  private handleJoinParty(socket: any, data: { name: string }): void {
    const username = this.getUsernameBySocket(socket);
    if (!username) {
      socket.emit('error', { message: 'You must be logged in to join a party' });
      return;
    }

    const party = this.parties.get(data.name);
    if (!party) {
      socket.emit('error', { message: 'Party not found' });
      return;
    }

    // Remove user from any existing party
    this.removeUserFromAllParties(username);

    // Add user to new party
    party.members.push({ name: username, status: 'online' });
    socket.emit('party_joined', { party });
    this.broadcastParties();
  }

  private handleLeaveParty(socket: any): void {
    const username = this.getUsernameBySocket(socket);
    if (!username) return;

    this.removeUserFromAllParties(username);
    socket.emit('party_left', {});
    this.broadcastParties();
  }

  private handleInviteToParty(socket: any, data: { username: string }): void {
    const inviter = this.getUsernameBySocket(socket);
    if (!inviter) {
      socket.emit('error', { message: 'You must be logged in to invite someone' });
      return;
    }

    const targetSocket = this.userSockets.get(data.username);
    if (!targetSocket) {
      socket.emit('error', { message: 'User not found or not online' });
      return;
    }

    const party = this.getUserParty(inviter);
    if (!party) {
      socket.emit('error', { message: 'You must be in a party to invite someone' });
      return;
    }

    targetSocket.emit('invite_received', { 
      partyName: party.name, 
      inviter: inviter 
    });
    socket.emit('invite_sent', { username: data.username });
  }

  private handleGetParties(socket: any): void {
    const partiesList = Array.from(this.parties.values()).map(party => ({
      id: party.id,
      name: party.name,
      leader: party.leader,
      memberCount: party.members.length,
      members: party.members
    }));
    socket.emit('parties_list', { parties: partiesList });
  }

  // Helper methods
  private getUsernameBySocket(socket: any): string | null {
    for (const [username, userSocket] of this.userSockets) {
      if (userSocket === socket) {
        return username;
      }
    }
    return null;
  }

  private removeUserFromAllParties(username: string): void {
    for (const [partyName, party] of this.parties) {
      party.members = party.members.filter((member: any) => member.name !== username);
      if (party.members.length === 0) {
        this.parties.delete(partyName);
      }
    }
  }

  private getUserParty(username: string): any | null {
    for (const party of this.parties.values()) {
      if (party.members.some((member: any) => member.name === username)) {
        return party;
      }
    }
    return null;
  }

  private broadcastParties(): void {
    const partiesList = Array.from(this.parties.values()).map(party => ({
      id: party.id,
      name: party.name,
      leader: party.leader,
      memberCount: party.members.length,
      members: party.members
    }));
    this.io.emit('parties_updated', { parties: partiesList });
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
    console.log(`Sending help command to socket ${socketId}`);
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
    console.log(`Emitting message to socket ${socketId}:`, { text: helpText });
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
