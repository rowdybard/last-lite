import { Game } from './game';

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const canvasElement = document.getElementById('gameCanvas');
  if (!canvasElement) {
    console.error('Game canvas not found!');
    return;
  }
  const canvas = canvasElement as unknown as HTMLCanvasElement;

  const game = new Game(canvas);
  
  // Handle window resize
  window.addEventListener('resize', () => {
    game.dispose();
    const newGame = new Game(canvas);
  });
});
