import { NetworkManager } from './network';
import { WorldState } from '../../shared/types';

export interface FeedMessage {
  at: number;
  text: string;
  type: 'info' | 'combat' | 'loot' | 'quest' | 'error';
  zone?: string;
}

export interface GameState {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  gold: number;
  xp: number;
  maxXp: number;
  currentZone: string;
  level: number;
}

export class TextGame {
  private networkManager: NetworkManager;
  private gameState: GameState;
  private feedMessages: FeedMessage[] = [];
  private commandHistory: string[] = [];
  private historyIndex: number = -1;
  private maxFeedLines: number = 200;

  constructor() {
    this.gameState = {
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      gold: 0,
      xp: 0,
      maxXp: 1000,
      currentZone: 'Hub',
      level: 1,
    };

    this.networkManager = new NetworkManager();
    this.initializeUI();
    this.setupNetwork();
    this.setupInputHandling();
  }

  private initializeUI(): void {
    // Initialize feed with welcome message
    this.addFeedMessage({
      at: Date.now(),
      text: 'Welcome to Last-Lite! Type "help" for available commands.',
      type: 'info',
      zone: 'Hub'
    });

    // Update status bars
    this.updateStatusBars();
  }

  private setupNetwork(): void {
    // Connect to hub room
    this.networkManager.connectToHub();
    
    // Set up state update handler
    this.networkManager.setOnStateUpdate((state: WorldState) => {
      this.updateFromWorldState(state);
    });

    // Set up zone transfer handler
    this.networkManager.setOnZoneTransfer((data: any) => {
      this.handleZoneTransfer(data);
    });

    // Set up feed message handler
    this.networkManager.setOnFeedMessage((message: FeedMessage) => {
      this.addFeedMessage(message);
    });
  }

  private setupInputHandling(): void {
    const commandInput = document.getElementById('command-input') as HTMLInputElement;
    const hotbarButtons = document.querySelectorAll('.hotbar-button');

    // Command input handling
    commandInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        const command = commandInput.value.trim();
        if (command) {
          this.executeCommand(command);
          this.addToHistory(command);
          commandInput.value = '';
        }
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.navigateHistory(-1);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.navigateHistory(1);
      }
    });

    // Hotbar button handling
    hotbarButtons.forEach(button => {
      button.addEventListener('click', () => {
        const abilityId = button.getAttribute('data-ability');
        if (abilityId) {
          this.executeHotkey(abilityId);
        }
      });
    });

    // Keyboard hotkeys (1-4)
    document.addEventListener('keydown', (event) => {
      if (event.key >= '1' && event.key <= '4') {
        event.preventDefault();
        this.executeHotkey(event.key);
      }
    });
  }

  private executeCommand(command: string): void {
    // Send command to server
    this.networkManager.sendCommand(command);
    
    // Add command to feed for immediate feedback
    this.addFeedMessage({
      at: Date.now(),
      text: `> ${command}`,
      type: 'info',
      zone: this.gameState.currentZone
    });
  }

  private executeHotkey(abilityId: string): void {
    // Map hotkey to ability command
    const abilityCommands = {
      '1': 'cast strike',
      '2': 'cast block', 
      '3': 'cast charge',
      '4': 'cast whirlwind'
    };

    const command = abilityCommands[abilityId as keyof typeof abilityCommands];
    if (command) {
      this.executeCommand(command);
    }
  }

  private addToHistory(command: string): void {
    this.commandHistory.unshift(command);
    if (this.commandHistory.length > 50) {
      this.commandHistory.pop();
    }
    this.historyIndex = -1;
    this.updateCommandHistory();
  }

  private navigateHistory(direction: number): void {
    const commandInput = document.getElementById('command-input') as HTMLInputElement;
    
    if (direction === -1 && this.historyIndex < this.commandHistory.length - 1) {
      this.historyIndex++;
    } else if (direction === 1 && this.historyIndex > -1) {
      this.historyIndex--;
    }

    if (this.historyIndex === -1) {
      commandInput.value = '';
    } else {
      commandInput.value = this.commandHistory[this.historyIndex];
    }
  }

  private updateCommandHistory(): void {
    const historyElement = document.getElementById('command-history');
    if (!historyElement) return;

    historyElement.innerHTML = '';
    this.commandHistory.slice(0, 10).forEach((command, index) => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.textContent = command;
      item.addEventListener('click', () => {
        const commandInput = document.getElementById('command-input') as HTMLInputElement;
        commandInput.value = command;
        commandInput.focus();
      });
      historyElement.appendChild(item);
    });
  }

  public addFeedMessage(message: FeedMessage): void {
    this.feedMessages.unshift(message);
    
    // Limit feed size
    if (this.feedMessages.length > this.maxFeedLines) {
      this.feedMessages = this.feedMessages.slice(0, this.maxFeedLines);
    }

    this.renderFeed();
  }

  private renderFeed(): void {
    const feedContent = document.getElementById('feed-content');
    if (!feedContent) return;

    feedContent.innerHTML = '';
    
    this.feedMessages.forEach(message => {
      const line = document.createElement('div');
      line.className = 'feed-line';
      line.setAttribute('data-type', message.type);
      
      const timestamp = new Date(message.at).toLocaleTimeString();
      const zone = message.zone || this.gameState.currentZone;
      
      line.innerHTML = `
        <span class="feed-timestamp">[${timestamp}]</span>
        <span class="feed-zone">[${zone}]</span>
        <span class="feed-text">${message.text}</span>
      `;
      
      feedContent.appendChild(line);
    });

    // Auto-scroll to top (newest messages)
    feedContent.scrollTop = 0;
  }

  private updateFromWorldState(state: WorldState): void {
    // Update player count in feed if available
    if (state.players) {
      const playerCount = state.players.size;
      this.addFeedMessage({
        at: Date.now(),
        text: `Players online: ${playerCount}`,
        type: 'info',
        zone: this.gameState.currentZone
      });
    }

    // Update other state properties as they become available
    // This will be expanded as we implement more game systems
  }

  private handleZoneTransfer(data: any): void {
    this.gameState.currentZone = data.targetZone === 'world:field:1' ? 'Field 1' : 'Hub';
    
    this.addFeedMessage({
      at: Date.now(),
      text: `You have entered ${this.gameState.currentZone}`,
      type: 'info',
      zone: this.gameState.currentZone
    });
  }

  private updateStatusBars(): void {
    const hpElement = document.getElementById('hp-value');
    const mpElement = document.getElementById('mp-value');
    const goldElement = document.getElementById('gold-value');
    const xpElement = document.getElementById('xp-value');

    if (hpElement) hpElement.textContent = `${this.gameState.hp}/${this.gameState.maxHp}`;
    if (mpElement) mpElement.textContent = `${this.gameState.mp}/${this.gameState.maxMp}`;
    if (goldElement) goldElement.textContent = this.gameState.gold.toString();
    if (xpElement) xpElement.textContent = `${this.gameState.xp}/${this.gameState.maxXp}`;
  }

  public updateGameState(newState: Partial<GameState>): void {
    this.gameState = { ...this.gameState, ...newState };
    this.updateStatusBars();
  }

  public dispose(): void {
    this.networkManager.disconnect();
  }
}