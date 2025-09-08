import { TextGame } from './text-game';

// Initialize the text game when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const game = new TextGame();
  
  // Handle page unload
  window.addEventListener('beforeunload', () => {
    game.dispose();
  });
});
