import { Router } from 'express';
import { NPC } from '../shared/types.js';

const router = Router();

let npcsData: NPC[] = [];

export function initializeNPCs(data: NPC[]) {
  npcsData = data;
}

router.get('/api/npcs', (req, res) => {
  res.json({ ok: true, data: npcsData });
});

router.get('/api/npcs/:id', (req, res) => {
  const npc = npcsData.find(n => n.id === req.params.id);
  if (!npc) {
    return res.status(404).json({ ok: false, error: 'NPC not found' });
  }
  
  res.json({ ok: true, data: npc });
});

export default router;
