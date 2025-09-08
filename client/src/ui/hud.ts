export interface GameState {
  playerCount: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  gold: number;
  xp: number;
  maxXp: number;
  currentZone: string;
}

export function renderHUD(container: HTMLElement, gameState: GameState): void {
  container.innerHTML = `
    <div class="hud">
      <div class="hud-top">
        <div class="player-count" data-hud-playercount>${gameState.playerCount}</div>
        <div class="zone-info" data-hud-zone>${gameState.currentZone}</div>
      </div>
      
      <div class="hud-bottom">
        <div class="health-bar">
          <span class="label">HP:</span>
          <span class="value" data-hud-hp>${gameState.hp}/${gameState.maxHp}</span>
        </div>
        
        <div class="mana-bar">
          <span class="label">MP:</span>
          <span class="value" data-hud-mp>${gameState.mp}/${gameState.maxMp}</span>
        </div>
        
        <div class="gold-display">
          <span class="label">Gold:</span>
          <span class="value" data-hud-gold>${gameState.gold}</span>
        </div>
        
        <div class="xp-bar">
          <span class="label">XP:</span>
          <span class="value">${gameState.xp}/${gameState.maxXp}</span>
        </div>
      </div>
    </div>
  `;
}
