import * as BABYLON from '@babylonjs/core';
import { getQualityProfile } from './utils/quality-profile';
import { renderHUD, GameState } from './ui/hud';
import { NetworkManager } from './network';
import { WorldState } from '@shared/types';
import { CharacterManager } from './rendering/character-manager';

export class Game {
  private engine!: BABYLON.Engine;
  private scene!: BABYLON.Scene;
  private canvas: HTMLCanvasElement;
  private gameState: GameState;
  private networkManager: NetworkManager;
  private characterManager: CharacterManager;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.gameState = {
      playerCount: 1,
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      gold: 0,
      xp: 0,
      maxXp: 1000,
      currentZone: 'Hub',
    };

    this.networkManager = new NetworkManager();
    this.initializeEngine();
    this.initializeScene();
    this.characterManager = new CharacterManager(this.scene);
    this.setupHUD();
    this.setupNetwork();
  }

  private initializeEngine(): void {
    const qualityProfile = getQualityProfile();
    
    this.engine = new BABYLON.Engine(this.canvas, true, {
      preserveDrawingBuffer: false,
      stencil: false,
      powerPreference: 'low-power',
    });

    // Apply quality profile settings
    this.engine.setHardwareScalingLevel(qualityProfile.hardwareScalingLevel);
    
    // Set body data attribute for CSS styling
    document.body.setAttribute('data-quality', qualityProfile.level);
  }

  private initializeScene(): void {
    this.scene = new BABYLON.Scene(this.engine);
    
    // Create camera
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 2.5,
      10,
      BABYLON.Vector3.Zero(),
      this.scene
    );
    camera.attachControl(this.canvas, true);

    // Create light
    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), this.scene);
    
    // Create ground
    const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 20, height: 20 }, this.scene);
    const groundMaterial = new BABYLON.StandardMaterial('groundMaterial', this.scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.4);
    ground.material = groundMaterial;

    // Performance optimizations for low-spec devices
    const qualityProfile = getQualityProfile();
    if (qualityProfile.level === 'low') {
      this.scene.skipPointerMovePicking = true;
      this.scene.fogEnabled = false;
      // Freeze static materials
      groundMaterial.freeze();
    }

    // Start render loop
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  private setupHUD(): void {
    const hudContainer = document.getElementById('hud');
    if (hudContainer) {
      renderHUD(hudContainer, this.gameState);
    }
  }

  private setupNetwork(): void {
    // Connect to hub room
    this.networkManager.connectToHub();
    
    // Set up state update handler
    this.networkManager.setOnStateUpdate((state: WorldState) => {
      this.updatePlayerCount(state.players.size);
      this.characterManager.updateFromWorldState(state);
    });

    // Set up zone transfer handler
    this.networkManager.setOnZoneTransfer((data: any) => {
      this.handleZoneTransfer(data);
    });

    // Set up input handling
    this.setupInputHandling();
  }

  private setupInputHandling(): void {
    const keys = {
      up: false,
      down: false,
      left: false,
      right: false,
    };

    // Keyboard event handlers
    document.addEventListener('keydown', (event) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.up = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.down = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.right = true;
          break;
      }
      this.networkManager.sendInput(keys);
    });

    document.addEventListener('keyup', (event) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.up = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.down = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.right = false;
          break;
      }
      this.networkManager.sendInput(keys);
    });
  }

  public updatePlayerCount(count: number): void {
    this.gameState.playerCount = count;
    const playerCountElement = document.querySelector('[data-hud-playercount]');
    if (playerCountElement) {
      playerCountElement.textContent = count.toString();
    }
  }

  public updateCurrentZone(zoneName: string): void {
    this.gameState.currentZone = zoneName;
    const zoneElement = document.querySelector('[data-hud-zone]');
    if (zoneElement) {
      zoneElement.textContent = zoneName;
    }
  }

  private handleZoneTransfer(data: any): void {
    console.log('Zone transfer:', data);
    
    // Update zone display
    this.updateCurrentZone(data.targetZone === 'world:field:1' ? 'Field 1' : 'Hub');
    
    // In a real implementation, we would:
    // 1. Disconnect from current room
    // 2. Connect to new room with transfer payload
    // 3. Update player state from payload
    // 4. Spawn player at new position
  }

  public dispose(): void {
    this.characterManager.dispose();
    this.networkManager.disconnect();
    this.engine.dispose();
  }
}
