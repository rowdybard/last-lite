import { TextGame } from './text-game';

// Initialize the text-based game when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const game = new TextGame();
  
  // Handle window resize
  window.addEventListener('resize', () => {
    game.handleResize();
  });
});