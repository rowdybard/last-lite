import * as BABYLON from '@babylonjs/core';
import { Player } from '@shared/types';

export class CharacterAvatar {
  private bodyMesh: BABYLON.Mesh;
  private headMesh: BABYLON.Mesh;
  private nameplateTexture: BABYLON.DynamicTexture;
  private nameplateMaterial: BABYLON.StandardMaterial;
  private player: Player;
  private scene: BABYLON.Scene;

  constructor(player: Player, scene: BABYLON.Scene) {
    this.player = player;
    this.scene = scene;

    this.createBody();
    this.createHead();
    this.createNameplate();
    this.applyRandomTint();
    this.updatePosition(player.pos);
    this.updateRotation(player.dir);
  }

  private createBody(): void {
    this.bodyMesh = BABYLON.MeshBuilder.CreateCapsule(
      `body-${this.player.id}`,
      {
        radius: 0.3,
        height: 1.2,
      },
      this.scene
    );

    const bodyMaterial = new BABYLON.StandardMaterial(`body-mat-${this.player.id}`, this.scene);
    bodyMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
    this.bodyMesh.material = bodyMaterial;
  }

  private createHead(): void {
    this.headMesh = BABYLON.MeshBuilder.CreateSphere(
      `head-${this.player.id}`,
      {
        diameter: 0.4,
      },
      this.scene
    );

    const headMaterial = new BABYLON.StandardMaterial(`head-mat-${this.player.id}`, this.scene);
    headMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.8, 0.7);
    this.headMesh.material = headMaterial;
  }

  private createNameplate(): void {
    // Create dynamic texture for nameplate
    this.nameplateTexture = new BABYLON.DynamicTexture(
      `nameplate-${this.player.id}`,
      { width: 256, height: 64 },
      this.scene
    );

    // Create material for nameplate
    this.nameplateMaterial = new BABYLON.StandardMaterial(`nameplate-mat-${this.player.id}`, this.scene);
    this.nameplateMaterial.diffuseTexture = this.nameplateTexture;
    this.nameplateMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
    this.nameplateMaterial.disableLighting = true;

    // Draw name on texture
    this.updateNameplate();

    // Create a plane for the nameplate
    const nameplatePlane = BABYLON.MeshBuilder.CreatePlane(
      `nameplate-plane-${this.player.id}`,
      { width: 2, height: 0.5 },
      this.scene
    );
    nameplatePlane.material = this.nameplateMaterial;
    nameplatePlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    nameplatePlane.parent = this.headMesh;
    nameplatePlane.position.y = 0.8;
  }

  private updateNameplate(): void {
    const context = this.nameplateTexture.getContext();
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, 256, 64);
    
    context.fillStyle = 'white';
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.fillText(this.player.name, 128, 40);
    
    this.nameplateTexture.update();
  }

  private applyRandomTint(): void {
    // Generate consistent random color based on player ID
    const hash = this.hashString(this.player.id);
    const r = ((hash >> 16) & 0xFF) / 255;
    const g = ((hash >> 8) & 0xFF) / 255;
    const b = (hash & 0xFF) / 255;

    const tintColor = new BABYLON.Color3(r, g, b);
    
    // Apply tint to body material
    if (this.bodyMesh.material) {
      (this.bodyMesh.material as BABYLON.StandardMaterial).diffuseColor = tintColor;
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  updatePosition(pos: { x: number; y: number; z: number }): void {
    this.bodyMesh.position = new BABYLON.Vector3(pos.x, pos.y, pos.z);
    this.headMesh.position = new BABYLON.Vector3(pos.x, pos.y + 0.7, pos.z);
  }

  updateRotation(dir: number): void {
    this.bodyMesh.rotation.y = dir;
    this.headMesh.rotation.y = dir;
  }

  updateAnimation(anim: string): void {
    // In a real implementation, this would update mesh animations
    // For now, we'll just store the animation state
    this.player.anim = anim;
  }

  updatePlayer(player: Player): void {
    this.player = player;
    this.updatePosition(player.pos);
    this.updateRotation(player.dir);
    this.updateAnimation(player.anim);
    
    // Update nameplate if name changed
    this.updateNameplate();
  }

  dispose(): void {
    this.bodyMesh.dispose();
    this.headMesh.dispose();
    this.nameplateTexture.dispose();
    this.nameplateMaterial.dispose();
  }
}
