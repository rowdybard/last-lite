import { describe, it, expect } from 'vitest';
import { renderHUD } from '../src/ui/hud';

describe('HUD Rendering', () => {
  it('should render player count display', () => {
    const container = document.createElement('div');
    const gameState = {
      playerCount: 2,
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      gold: 1000,
      xp: 500,
      maxXp: 1000,
      currentZone: 'Hub',
    };

    renderHUD(container, gameState);

    const playerCountElement = container.querySelector('[data-hud-playercount]');
    expect(playerCountElement).toBeTruthy();
    expect(playerCountElement?.textContent).toBe('2');
  });

  it('should render HP and MP bars', () => {
    const container = document.createElement('div');
    const gameState = {
      playerCount: 1,
      hp: 75,
      maxHp: 100,
      mp: 25,
      maxMp: 50,
      gold: 0,
      xp: 0,
      maxXp: 1000,
      currentZone: 'Field 1',
    };

    renderHUD(container, gameState);

    const hpBar = container.querySelector('[data-hud-hp]');
    const mpBar = container.querySelector('[data-hud-mp]');
    
    expect(hpBar).toBeTruthy();
    expect(mpBar).toBeTruthy();
    expect(hpBar?.textContent).toContain('75/100');
    expect(mpBar?.textContent).toContain('25/50');
  });

  it('should render gold display', () => {
    const container = document.createElement('div');
    const gameState = {
      playerCount: 1,
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      gold: 2500,
      xp: 0,
      maxXp: 1000,
      currentZone: 'Hub',
    };

    renderHUD(container, gameState);

    const goldElement = container.querySelector('[data-hud-gold]');
    expect(goldElement).toBeTruthy();
    expect(goldElement?.textContent).toBe('2500');
  });

  it('should render zone information', () => {
    const container = document.createElement('div');
    const gameState = {
      playerCount: 1,
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      gold: 0,
      xp: 0,
      maxXp: 1000,
      currentZone: 'Field 1',
    };

    renderHUD(container, gameState);

    const zoneElement = container.querySelector('[data-hud-zone]');
    expect(zoneElement).toBeTruthy();
    expect(zoneElement?.textContent).toBe('Field 1');
  });
});
