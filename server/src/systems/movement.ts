import { Player } from '@shared/types';

export interface MovementConfig {
  bound: number;
  maxSpeed: number;
  friction?: number;
}

export class MovementSystem {
  private config: MovementConfig;

  constructor(config: MovementConfig) {
    this.config = {
      friction: 0.95,
      ...config,
    };
  }

  step(deltaTime: number, player: Player): void {
    // Apply friction
    if (this.config.friction) {
      player.vel.vx *= this.config.friction;
      player.vel.vz *= this.config.friction;
    }

    // Clamp velocity to max speed
    const speed = Math.hypot(player.vel.vx, player.vel.vz);
    if (speed > this.config.maxSpeed) {
      const scale = this.config.maxSpeed / speed;
      player.vel.vx *= scale;
      player.vel.vz *= scale;
    }

    // Update position
    player.pos.x += player.vel.vx * deltaTime;
    player.pos.z += player.vel.vz * deltaTime;

    // Clamp position to world bounds
    player.pos.x = Math.max(-this.config.bound, Math.min(this.config.bound, player.pos.x));
    player.pos.z = Math.max(-this.config.bound, Math.min(this.config.bound, player.pos.z));
  }
}
