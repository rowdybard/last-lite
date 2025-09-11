import { Router } from 'express';
import { Hub } from '../../shared/types.js';

const router = Router();

let hubData: Hub | null = null;

export function initializeHub(data: Hub) {
  hubData = data;
}

router.get('/api/hub', (req, res) => {
  if (!hubData) {
    return res.status(500).json({ ok: false, error: 'Hub not initialized' });
  }
  
  res.json({ ok: true, data: hubData });
});

export default router;
