import React, { useState, useEffect } from 'react';
import { NPC, Hub } from '../types/game';
import { npcAPI } from '../api/npc';
import { useUIStore } from '../state/useUIStore';
import { usePlayerStore } from '../state/usePlayerStore';
import NPCList from './NPCList';
import DialogueModal from './DialogueModal';
import ShopModal from './ShopModal';
import QuestLog from './QuestLog';

const HubView: React.FC = () => {
  const [hub, setHub] = useState<Hub | null>(null);
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { currentModal, ambientTextIndex, nextAmbientText } = useUIStore();
  const { setPlayer } = usePlayerStore();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Rotate ambient text every 5 seconds
    const interval = setInterval(nextAmbientText, 5000);
    return () => clearInterval(interval);
  }, [nextAmbientText]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load hub data
      const hubResponse = await fetch('/api/hub');
      const hubData = await hubResponse.json();
      if (hubData.ok) {
        setHub(hubData.data);
      }

      // Load NPCs
      const npcsResponse = await npcAPI.getAll();
      if (npcsResponse.ok) {
        setNpcs(npcsResponse.data!);
      }

      // Load player state
      const playerResponse = await fetch('/api/player');
      const playerData = await playerResponse.json();
      if (playerData.ok) {
        setPlayer(playerData.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="hub-view">
        <div className="loading">Loading Hub...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hub-view">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="hub-view">
      <div className="hub-header">
        <h1>{hub?.name || 'Hub'}</h1>
        {hub?.ambientText && hub.ambientText.length > 0 && (
          <p className="ambient-text">
            {hub.ambientText[ambientTextIndex]}
          </p>
        )}
      </div>

      <NPCList npcs={npcs} />

      {currentModal === 'dialogue' && <DialogueModal />}
      {currentModal === 'shop' && <ShopModal />}
      {currentModal === 'quests' && <QuestLog />}
    </div>
  );
};

export default HubView;
