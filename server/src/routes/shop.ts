import { Router } from 'express';
import { ShopService } from '../services/shop.js';
import { PlayerState } from '../../shared/types.js';

const router = Router();

let shopService: ShopService | null = null;
let playerState: PlayerState = {
  gold: 25,
  inventory: [{ itemId: 'itm_health_vial', qty: 2 }],
  questLog: [],
  flags: {}
};

export function initializeShop(service: ShopService) {
  shopService = service;
}

export function setPlayerState(state: PlayerState) {
  playerState = state;
}

export function getPlayerState(): PlayerState {
  return playerState;
}

router.get('/api/shop/:shopId', (req, res) => {
  if (!shopService) {
    return res.status(500).json({ ok: false, error: 'Shop service not initialized' });
  }

  const { shopId } = req.params;
  const shop = shopService.getShop(shopId);
  if (!shop) {
    return res.status(404).json({ ok: false, error: 'Shop not found' });
  }

  const inventory = shopService.getShopInventory(shopId);
  res.json({ ok: true, data: { shop, inventoryResolved: inventory } });
});

router.post('/api/shop/buy', (req, res) => {
  if (!shopService) {
    return res.status(500).json({ ok: false, error: 'Shop service not initialized' });
  }

  const { shopId, itemId, qty } = req.body;
  if (!shopId || !itemId || !qty) {
    return res.status(400).json({ ok: false, error: 'shopId, itemId, and qty required' });
  }

  const result = shopService.buyItem(shopId, itemId, qty, playerState);
  if (result.ok) {
    playerState = result.player;
    res.json({ ok: true, player: playerState });
  } else {
    res.status(400).json({ ok: false, error: result.reason });
  }
});

router.post('/api/shop/sell', (req, res) => {
  if (!shopService) {
    return res.status(500).json({ ok: false, error: 'Shop service not initialized' });
  }

  const { shopId, itemId, qty } = req.body;
  if (!shopId || !itemId || !qty) {
    return res.status(400).json({ ok: false, error: 'shopId, itemId, and qty required' });
  }

  const result = shopService.sellItem(shopId, itemId, qty, playerState);
  if (result.ok) {
    playerState = result.player;
    res.json({ ok: true, player: playerState });
  } else {
    res.status(400).json({ ok: false, error: result.reason });
  }
});

export default router;
