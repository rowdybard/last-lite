import { Router } from 'express';
import { DialogueService } from '../services/dialogue.js';
import { PlayerState } from '../../shared/types.js';

const router = Router();

let dialogueService: DialogueService | null = null;
let playerState: PlayerState = {
  gold: 25,
  inventory: [{ itemId: 'itm_health_vial', qty: 2 }],
  questLog: [],
  flags: {}
};

export function initializeDialogue(service: DialogueService) {
  dialogueService = service;
}

export function setPlayerState(state: PlayerState) {
  playerState = state;
}

export function getPlayerState(): PlayerState {
  return playerState;
}

router.post('/api/dialogue/advance', (req, res) => {
  if (!dialogueService) {
    return res.status(500).json({ ok: false, error: 'Dialogue service not initialized' });
  }

  const { currentNodeId, optionIndex } = req.body;
  if (!currentNodeId || optionIndex === undefined) {
    return res.status(400).json({ ok: false, error: 'currentNodeId and optionIndex required' });
  }

  const node = dialogueService.getNode(currentNodeId);
  if (!node) {
    return res.status(404).json({ ok: false, error: 'Dialogue node not found' });
  }

  const option = node.options[optionIndex];
  if (!option) {
    return res.status(400).json({ ok: false, error: 'Invalid option index' });
  }

  // Check requirements
  if (option.requirements) {
    const reqCheck = dialogueService.checkRequirements(option.requirements, playerState);
    if (!reqCheck.ok) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Requirements not met', 
        reasons: reqCheck.reasons 
      });
    }
  }

  // Check visibility
  if (!dialogueService.isOptionVisible(option, playerState)) {
    return res.status(400).json({ ok: false, error: 'Option not visible' });
  }

  // Apply effects
  let newPlayer = playerState;
  let errors: string[] = [];
  
  if (option.effects) {
    const effectResult = dialogueService.applyEffects(option.effects, playerState);
    newPlayer = effectResult.player;
    errors = effectResult.errors;
    playerState = newPlayer; // Update global state
  }

  const response = {
    nextNode: option.next,
    player: newPlayer,
    errors: errors.length > 0 ? errors : undefined
  };

  res.json({ ok: true, data: response });
});

export default router;
