import { io, Socket } from 'socket.io-client';

export class SocketGameClient {
  private socket: Socket | null = null;
  private gameState: any = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.initializeNetwork();
  }

  private initializeNetwork(): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const serverUrl = `${protocol}//${host}`;

    console.log('Connecting to Socket.io server:', serverUrl);
    console.log('Current location:', window.location.href);

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to Socket.io server:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.connectToHub();
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Disconnected from server:', reason);
      this.isConnected = false;
      this.handleDisconnection();
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Connection error:', error);
      this.isConnected = false;
      this.handleConnectionError();
    });

    this.socket.on('state', (state: any) => {
      console.log('Received game state:', state);
      this.gameState = state;
      this.updateUI();
    });

    this.socket.on('message', (message: any) => {
      console.log('Received message:', message);
      this.addToWorldFeed(message.text);
    });

    this.socket.on('player_joined', (data: any) => {
      console.log('Player joined:', data);
      this.addToWorldFeed(`${data.playerName} joined the game`);
    });

    this.socket.on('player_left', (data: any) => {
      console.log('Player left:', data);
      this.addToWorldFeed('A player left the game');
    });

    this.socket.on('error', (error: Error) => {
      console.error('Server error:', error);
      this.addToWorldFeed(`Error: ${error.message || 'Unknown error'}`);
    });
  }

  private connectToHub(): void {
    if (!this.socket || !this.isConnected) return;

    console.log('Joining hub room...');
    this.socket.emit('join_room', {
      roomName: 'world_hub',
      playerName: 'TestPlayer',
      playerClass: 'Warrior'
    });
  }

  private handleDisconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.reconnect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.addToWorldFeed('Connection lost. Please refresh the page.');
    }
  }

  private handleConnectionError(): void {
    this.addToWorldFeed('Failed to connect to server. Please check your connection.');
  }

  private reconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.initializeNetwork();
  }

  public handleCommand(command: string): void {
    if (!this.socket || !this.isConnected) {
      console.error('Not connected to server');
      this.addToWorldFeed('Not connected to server');
      return;
    }

    console.log('Sending command:', command);
    this.socket.emit('command', { text: command });
  }

  private updateUI(): void {
    if (!this.gameState) return;

    // Update player list
    this.updatePlayerList();
    
    // Update world feed with current state info
    this.addToWorldFeed(`Game state updated - ${Object.keys(this.gameState.players || {}).length} players online`);
  }

  private updatePlayerList(): void {
    const playerListElement = document.getElementById('player-list');
    if (!playerListElement || !this.gameState?.players) return;

    const players = Object.values(this.gameState.players);
    playerListElement.innerHTML = players.map((player: any) => 
      `<div class="player-item">${player.name} (${player.class}) - Level ${player.level}</div>`
    ).join('');
  }

  private addToWorldFeed(message: string): void {
    const worldFeed = document.getElementById('world-feed');
    if (!worldFeed) return;

    const messageElement = document.createElement('div');
    messageElement.className = 'world-message';
    messageElement.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    worldFeed.appendChild(messageElement);
    worldFeed.scrollTop = worldFeed.scrollHeight;

    // Keep only last 50 messages
    const messages = worldFeed.children;
    if (messages.length > 50) {
      worldFeed.removeChild(messages[0]);
    }
  }

  public getGameState(): any {
    return this.gameState;
  }

  public isServerConnected(): boolean {
    return this.isConnected;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }
}
