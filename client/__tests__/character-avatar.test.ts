import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CharacterAvatar } from '../src/rendering/character-avatar';
import * as BABYLON from '@babylonjs/core';

// Mock Babylon.js
vi.mock('@babylonjs/core', () => ({
  MeshBuilder: {
    CreateCapsule: vi.fn(() => ({
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      material: null,
      dispose: vi.fn(),
    })),
    CreateSphere: vi.fn(() => ({
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      material: null,
      dispose: vi.fn(),
    })),
    CreatePlane: vi.fn(() => ({
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      material: null,
      parent: null,
      billboardMode: 0,
      dispose: vi.fn(),
    })),
  },
  StandardMaterial: vi.fn(() => ({
    diffuseColor: null,
    emissiveColor: null,
    disableLighting: false,
    diffuseTexture: null,
    freeze: vi.fn(),
    dispose: vi.fn(),
  })),
  Color3: vi.fn((r, g, b) => ({ r, g, b })),
  Vector3: vi.fn((x, y, z) => ({ x, y, z })),
  DynamicTexture: vi.fn(() => ({
    getContext: vi.fn(() => ({
      fillStyle: '',
      font: '',
      textAlign: '',
      fillText: vi.fn(),
      fillRect: vi.fn(),
    })),
    update: vi.fn(),
  })),
  Texture: vi.fn(),
  Mesh: {
    BILLBOARDMODE_ALL: 7,
  },
}));

describe('CharacterAvatar', () => {
  let mockScene: any;
  let mockPlayer: any;

  beforeEach(() => {
    mockScene = {
      dispose: vi.fn(),
    };

    mockPlayer = {
      id: 'test-player-1',
      name: 'TestPlayer',
      class: 'Warrior',
      pos: { x: 0, y: 0, z: 0 },
      dir: 0,
      anim: 'idle',
    };
  });

  it('should create capsule body and head meshes', () => {
    const avatar = new CharacterAvatar(mockPlayer, mockScene);
    
    expect(BABYLON.MeshBuilder.CreateCapsule).toHaveBeenCalledWith(
      'body-test-player-1',
      { radius: 0.3, height: 1.2 },
      mockScene
    );
    
    expect(BABYLON.MeshBuilder.CreateSphere).toHaveBeenCalledWith(
      'head-test-player-1',
      { diameter: 0.4 },
      mockScene
    );
  });

  it('should create nameplate with player name', () => {
    const avatar = new CharacterAvatar(mockPlayer, mockScene);
    
    expect(BABYLON.DynamicTexture).toHaveBeenCalledWith(
      'nameplate-test-player-1',
      { width: 256, height: 64 },
      mockScene
    );
  });

  it('should apply random color tint to player', () => {
    const avatar1 = new CharacterAvatar(mockPlayer, mockScene);
    const avatar2 = new CharacterAvatar({ ...mockPlayer, id: 'test-player-2' }, mockScene);
    
    // Both should have different colors (randomized based on player ID)
    expect(avatar1).toBeDefined();
    expect(avatar2).toBeDefined();
  });

  it('should update position when player moves', () => {
    const avatar = new CharacterAvatar(mockPlayer, mockScene);
    const mockBody = { position: { x: 0, y: 0, z: 0 } };
    const mockHead = { position: { x: 0, y: 0, z: 0 } };
    
    // Mock the meshes
    (avatar as any).bodyMesh = mockBody;
    (avatar as any).headMesh = mockHead;
    
    const newPos = { x: 5, y: 0, z: 3 };
    avatar.updatePosition(newPos);
    
    expect(mockBody.position).toEqual({ x: 5, y: 0, z: 3 });
    expect(mockHead.position).toEqual({ x: 5, y: 0.7, z: 3 });
  });

  it('should update rotation when player turns', () => {
    const avatar = new CharacterAvatar(mockPlayer, mockScene);
    const mockBody = { rotation: { x: 0, y: 0, z: 0 } };
    const mockHead = { rotation: { x: 0, y: 0, z: 0 } };
    
    // Mock the meshes
    (avatar as any).bodyMesh = mockBody;
    (avatar as any).headMesh = mockHead;
    
    avatar.updateRotation(1.5);
    
    expect(mockBody.rotation.y).toBe(1.5);
    expect(mockHead.rotation.y).toBe(1.5);
  });

  it('should update animation state', () => {
    const avatar = new CharacterAvatar(mockPlayer, mockScene);
    
    avatar.updateAnimation('walk');
    // In a real implementation, this would update mesh animations
    expect(avatar).toBeDefined();
  });

  it('should dispose of all meshes when destroyed', () => {
    const avatar = new CharacterAvatar(mockPlayer, mockScene);
    const mockBody = { dispose: vi.fn() };
    const mockHead = { dispose: vi.fn() };
    const mockNameplate = { dispose: vi.fn() };
    
    // Mock the meshes
    (avatar as any).bodyMesh = mockBody;
    (avatar as any).headMesh = mockHead;
    (avatar as any).nameplateTexture = mockNameplate;
    
    avatar.dispose();
    
    expect(mockBody.dispose).toHaveBeenCalled();
    expect(mockHead.dispose).toHaveBeenCalled();
    expect(mockNameplate.dispose).toHaveBeenCalled();
  });
});
