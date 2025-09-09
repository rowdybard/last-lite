import { Client } from 'colyseus.js';
import { FeedSystem, FeedEntry } from './ui/feed-system';

export interface GameState {
  zoneId: string;
  pos: { x: number; y: number };
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  gold: number;
  level: number;
  xp: number;
  maxXp: number;
}

export class TextGame {
  private client!: Client;
  private room: any;
  private feedSystem!: FeedSystem;
  private gameState: GameState;
  private commandHistory: string[] = [];
  private historyIndex: number = -1;

  constructor() {
    this.gameState = {
      zoneId: 'world:hub',
      pos: { x: 0, y: 0 },
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      gold: 0,
      level: 1,
      xp: 0,
      maxXp: 1000
    };

    this.initializeFeed();
    this.initializeNetwork();
    this.initializeUI();
  }

  private initializeFeed(): void {
    const feedContainer = document.getElementById('feedContainer');
    if (!feedContainer) {
      throw new Error('Feed container not found');
    }
    
    this.feedSystem = new FeedSystem(feedContainer);
  }

  private initializeNetwork(): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.client = new Client(`${protocol}//${host}`);

    this.connectToHub();
  }

  private async connectToHub(): Promise<void> {
    try {
      console.log('Attempting to connect to room: world_hub');
      this.room = await this.client.joinOrCreate('world_hub', {
        name: 'TestPlayer',
        class: 'Warrior',
      });

      console.log('Connected to hub room:', this.room.id);

      // Listen for feed updates
      this.room.onMessage('feed', (entries: FeedEntry[]) => {
        this.feedSystem.addEntries(entries);
      });

      // Listen for state updates
      this.room.onMessage('state', (state: any) => {
        this.updateGameState(state);
      });

      // Listen for zone transfer messages
      this.room.onMessage('zone_transfer', (data: any) => {
        this.handleZoneTransfer(data);
      });

      // Listen for zone swap errors
      this.room.onMessage('zone_swap_error', (data: any) => {
        this.feedSystem.addEntry({
          at: Date.now(),
          text: `Zone transfer failed: ${data.reason}`,
          type: 'error'
        });
      });

      // Listen for errors
      this.room.onError((code: number, message: string) => {
        this.feedSystem.addEntry({
          at: Date.now(),
          text: `Connection error: ${message}`,
          type: 'error'
        });
      });

      // Send initial welcome message
      this.feedSystem.addEntry({
        at: Date.now(),
        text: 'Welcome to Last-Lite! Type "help" for commands.',
        type: 'info'
      });

    } catch (error) {
      this.feedSystem.addEntry({
        at: Date.now(),
        text: `Failed to connect: ${error}`,
        type: 'error'
      });
    }
  }

  private initializeUI(): void {
    const commandInput = document.getElementById('commandInput') as HTMLInputElement;
    if (!commandInput) {
      throw new Error('Command input not found');
    }

    // Command input handling
    commandInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.handleCommand(commandInput.value);
        commandInput.value = '';
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.navigateHistory(-1);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.navigateHistory(1);
      }
    });

    // Hotkey handling
    document.addEventListener('keydown', (event) => {
      if (event.key >= '1' && event.key <= '4') {
        this.handleHotkey(event.key);
      }
    });

    // Hotkey button handling
    document.querySelectorAll('.hotkey-button').forEach(button => {
      button.addEventListener('click', () => {
        const hotkey = button.getAttribute('data-hotkey');
        if (hotkey) {
          this.handleHotkey(hotkey);
        }
      });
    });
  }

  private handleCommand(command: string): void {
    if (!command.trim()) return;

    // Add to history
    this.commandHistory.push(command);
    this.historyIndex = this.commandHistory.length;

    // Send to server
    if (this.room) {
      this.room.send('cmd', { text: command });
    }

    // Show in feed
    this.feedSystem.addEntry({
      at: Date.now(),
      text: `> ${command}`,
      type: 'info'
    });
  }

  private handleHotkey(hotkey: string): void {
    const abilityMap: Record<string, string> = {
      '1': 'slash',
      '2': 'shield',
      '3': 'charge',
      '4': 'whirlwind'
    };

    const ability = abilityMap[hotkey];
    if (ability) {
      this.handleCommand(`cast ${ability}`);
    }
  }

  private navigateHistory(direction: number): void {
    if (this.commandHistory.length === 0) return;

    this.historyIndex += direction;
    
    if (this.historyIndex < 0) {
      this.historyIndex = 0;
    } else if (this.historyIndex >= this.commandHistory.length) {
      this.historyIndex = this.commandHistory.length;
    }

    const commandInput = document.getElementById('commandInput') as HTMLInputElement;
    if (commandInput) {
      if (this.historyIndex === this.commandHistory.length) {
        commandInput.value = '';
      } else {
        commandInput.value = this.commandHistory[this.historyIndex];
      }
    }
  }

  private updateGameState(state: any): void {
    if (state.zoneId) this.gameState.zoneId = state.zoneId;
    if (state.pos) this.gameState.pos = state.pos;
    if (state.hp !== undefined) this.gameState.hp = state.hp;
    if (state.maxHp !== undefined) this.gameState.maxHp = state.maxHp;
    if (state.mp !== undefined) this.gameState.mp = state.mp;
    if (state.maxMp !== undefined) this.gameState.maxMp = state.maxMp;
    if (state.gold !== undefined) this.gameState.gold = state.gold;
    if (state.level !== undefined) this.gameState.level = state.level;
    if (state.xp !== undefined) this.gameState.xp = state.xp;
    if (state.maxXp !== undefined) this.gameState.maxXp = state.maxXp;

    this.updateUI();
  }

  private handleZoneTransfer(data: any): void {
    const { targetZone, payload } = data;
    
    // Update game state with transfer payload
    this.updateGameState(payload);
    
    // Update zone ID
    this.gameState.zoneId = targetZone;
    
    // Leave current room and connect to new zone
    if (this.room) {
      this.room.leave();
    }
    
    // Connect to new zone
    this.connectToZone(targetZone, payload);
    
    // Show transfer message
    this.feedSystem.addEntry({
      at: Date.now(),
      text: `Transferring to ${this.getZoneDisplayName(targetZone)}...`,
      type: 'info'
    });
  }

  private async connectToZone(zoneId: string, payload: any): Promise<void> {
    try {
      console.log('Attempting to connect to zone:', zoneId);
      this.room = await this.client.joinOrCreate(zoneId, {
        name: 'TestPlayer',
        class: 'Warrior',
        ...payload
      });

      console.log(`Connected to zone: ${zoneId}`);

      // Re-setup message listeners
      this.room.onMessage('feed', (entries: FeedEntry[]) => {
        this.feedSystem.addEntries(entries);
      });

      this.room.onMessage('state', (state: any) => {
        this.updateGameState(state);
      });

      this.room.onMessage('zone_transfer', (data: any) => {
        this.handleZoneTransfer(data);
      });

      this.room.onMessage('zone_swap_error', (data: any) => {
        this.feedSystem.addEntry({
          at: Date.now(),
          text: `Zone transfer failed: ${data.reason}`,
          type: 'error'
        });
      });

      this.room.onError((code: number, message: string) => {
        this.feedSystem.addEntry({
          at: Date.now(),
          text: `Connection error: ${message}`,
          type: 'error'
        });
      });

      // Show success message
      this.feedSystem.addEntry({
        at: Date.now(),
        text: `Welcome to ${this.getZoneDisplayName(zoneId)}!`,
        type: 'info'
      });

    } catch (error) {
      this.feedSystem.addEntry({
        at: Date.now(),
        text: `Failed to connect to zone: ${error}`,
        type: 'error'
      });
    }
  }

  private getZoneDisplayName(zoneId: string): string {
    if (zoneId === 'world:hub') return 'Hub';
    if (zoneId.startsWith('world:field:')) return 'Field';
    if (zoneId.startsWith('world:dungeon:')) return 'Dungeon';
    return zoneId;
  }

  private updateUI(): void {
    // Update zone
    const zoneElement = document.getElementById('currentZone');
    if (zoneElement) {
      zoneElement.textContent = this.getZoneDisplayName(this.gameState.zoneId);
    }

    // Update HP
    const hpElement = document.getElementById('hpValue');
    if (hpElement) {
      hpElement.textContent = `${this.gameState.hp}/${this.gameState.maxHp}`;
    }

    // Update MP
    const mpElement = document.getElementById('mpValue');
    if (mpElement) {
      mpElement.textContent = `${this.gameState.mp}/${this.gameState.maxMp}`;
    }

    // Update Gold
    const goldElement = document.getElementById('goldValue');
    if (goldElement) {
      goldElement.textContent = this.gameState.gold.toString();
    }

    // Update XP
    const xpElement = document.getElementById('xpValue');
    if (xpElement) {
      xpElement.textContent = `${this.gameState.xp}/${this.gameState.maxXp}`;
    }
  }

  public handleResize(): void {
    // Handle window resize if needed
    console.log('Window resized');
  }

  public dispose(): void {
    if (this.room) {
      this.room.leave();
    }
  }
}
