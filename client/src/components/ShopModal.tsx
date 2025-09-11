import React, { useState, useEffect } from 'react';
import { Shop, ShopInventoryItem } from '../types/game';
import { useUIStore } from '../state/useUIStore';
import { usePlayerStore } from '../state/usePlayerStore';
import { shopAPI } from '../api/shop';

const ShopModal: React.FC = () => {
  const { selectedShopId, closeModal } = useUIStore();
  const { player, setPlayer } = usePlayerStore();
  const [shop, setShop] = useState<Shop | null>(null);
  const [inventory, setInventory] = useState<ShopInventoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [selectedItem, setSelectedItem] = useState<ShopInventoryItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedShopId) {
      loadShop();
    }
  }, [selectedShopId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  const loadShop = async () => {
    if (!selectedShopId) return;

    try {
      const response = await shopAPI.getShop(selectedShopId);
      if (response.ok && response.data) {
        setShop(response.data.shop);
        setInventory(response.data.inventoryResolved);
      } else {
        setError(response.error || 'Failed to load shop');
      }
    } catch (err) {
      setError('Failed to load shop');
    }
  };

  const handleBuy = async () => {
    if (!selectedItem || !selectedShopId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await shopAPI.buyItem(selectedShopId, selectedItem.item.id, quantity);
      if (response.ok && response.data) {
        setPlayer(response.data.player);
        await loadShop(); // Refresh shop inventory
        setQuantity(1);
      } else {
        setError(response.error || 'Failed to buy item');
      }
    } catch (err) {
      setError('Failed to buy item');
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    if (!selectedItem || !selectedShopId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await shopAPI.sellItem(selectedShopId, selectedItem.item.id, quantity);
      if (response.ok && response.data) {
        setPlayer(response.data.player);
        setQuantity(1);
      } else {
        setError(response.error || 'Failed to sell item');
      }
    } catch (err) {
      setError('Failed to sell item');
    } finally {
      setLoading(false);
    }
  };

  const getPlayerItemCount = (itemId: string): number => {
    if (!player) return 0;
    const item = player.inventory.find(i => i.itemId === itemId);
    return item ? item.qty : 0;
  };

  const getSellPrice = (item: ShopInventoryItem): number => {
    return Math.floor(item.item.baseValue * (shop?.sellRules.priceFactor || 0.5));
  };

  if (!selectedShopId || !shop) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="shop-modal">
        <div className="shop-header">
          <h2>Shop</h2>
          <div className="player-gold">Gold: {player?.gold || 0}</div>
          <button className="close-button" onClick={closeModal}>×</button>
        </div>

        <div className="shop-tabs">
          <button
            className={`tab ${activeTab === 'buy' ? 'active' : ''}`}
            onClick={() => setActiveTab('buy')}
          >
            Buy
          </button>
          <button
            className={`tab ${activeTab === 'sell' ? 'active' : ''}`}
            onClick={() => setActiveTab('sell')}
          >
            Sell
          </button>
        </div>

        <div className="shop-content">
          {activeTab === 'buy' ? (
            <div className="buy-section">
              <div className="inventory-grid">
                {inventory.map((item) => (
                  <div
                    key={item.item.id}
                    className={`inventory-item ${selectedItem?.item.id === item.item.id ? 'selected' : ''}`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="item-name">{item.item.name}</div>
                    <div className="item-price">{item.price} gold</div>
                    <div className="item-stock">
                      Stock: {item.stock === -1 ? '∞' : item.stock}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="sell-section">
              <div className="inventory-grid">
                {player?.inventory.map((playerItem) => {
                  const shopItem = inventory.find(i => i.item.id === playerItem.itemId);
                  if (!shopItem) return null;

                  return (
                    <div
                      key={playerItem.itemId}
                      className={`inventory-item ${selectedItem?.item.id === playerItem.itemId ? 'selected' : ''}`}
                      onClick={() => setSelectedItem(shopItem)}
                    >
                      <div className="item-name">{shopItem.item.name}</div>
                      <div className="item-price">{getSellPrice(shopItem)} gold</div>
                      <div className="item-stock">Owned: {playerItem.qty}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedItem && (
            <div className="transaction-panel">
              <h3>{selectedItem.item.name}</h3>
              <div className="quantity-controls">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
              
              {activeTab === 'buy' ? (
                <div>
                  <div>Total: {selectedItem.price * quantity} gold</div>
                  <button
                    onClick={handleBuy}
                    disabled={loading || !player || player.gold < selectedItem.price * quantity}
                  >
                    Buy
                  </button>
                </div>
              ) : (
                <div>
                  <div>Total: {getSellPrice(selectedItem) * quantity} gold</div>
                  <button
                    onClick={handleSell}
                    disabled={loading || getPlayerItemCount(selectedItem.item.id) < quantity}
                  >
                    Sell
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {error && <div className="error">{error}</div>}
        {loading && <div className="loading">Processing...</div>}
      </div>
    </div>
  );
};

export default ShopModal;
