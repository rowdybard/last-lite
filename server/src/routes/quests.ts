import { Router } from 'express';
import { QuestService } from '../services/quests.js';
import { PlayerState } from '../../shared/types.js';

const router = Router();

let questService: QuestService | null = null;
let playerState: PlayerState = {
  gold: 25,
  inventory: [{ itemId: 'itm_health_vial', qty: 2 }],
  questLog: [],
  flags: {}
};

export function initializeQuests(service: QuestService) {
  questService = service;
}

router.get('/api/quests', (req, res) => {
  if (!questService) {
    return res.status(500).json({ ok: false, error: 'Quest service not initialized' });
  }
  
  res.json({ ok: true, data: questService.getAllQuests() });
});

router.post('/api/quests/start', (req, res) => {
  if (!questService) {
    return res.status(500).json({ ok: false, error: 'Quest service not initialized' });
  }

  const { questId } = req.body;
  if (!questId) {
    return res.status(400).json({ ok: false, error: 'Quest ID required' });
  }

  const result = questService.startQuest(questId, playerState);
  if (result.ok) {
    playerState = result.player;
    res.json({ ok: true, player: playerState });
  } else {
    res.status(400).json({ ok: false, error: result.reason });
  }
});

router.post('/api/quests/complete', (req, res) => {
  if (!questService) {
    return res.status(500).json({ ok: false, error: 'Quest service not initialized' });
  }

  const { questId } = req.body;
  if (!questId) {
    return res.status(400).json({ ok: false, error: 'Quest ID required' });
  }

  const result = questService.completeQuest(questId, playerState);
  if (result.ok) {
    playerState = result.player;
    res.json({ ok: true, rewards: result.rewards, player: playerState });
  } else {
    res.status(400).json({ ok: false, error: result.reason });
  }
});

router.get('/api/player', (req, res) => {
  res.json({ ok: true, data: playerState });
});

// Debug route for testing
router.post('/api/player/debugGive', (req, res) => {
  const { itemId, qty } = req.body;
  if (!itemId || !qty) {
    return res.status(400).json({ ok: false, error: 'itemId and qty required' });
  }

  const existing = playerState.inventory.find(i => i.itemId === itemId);
  if (existing) {
    existing.qty += qty;
  } else {
    playerState.inventory.push({ itemId, qty });
  }

  res.json({ ok: true, data: playerState });
});

export default router;
