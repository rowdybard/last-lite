import React, { useState, useEffect } from 'react';
import { NPC, DialogueNode } from '../types/game';
import { useUIStore } from '../state/useUIStore';
import { dialogueAPI } from '../api/dialogue';

interface NPCListProps {
  npcs: NPC[];
}

const NPCList: React.FC<NPCListProps> = ({ npcs }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { openDialogue, openShop } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(npcs.length - 1, prev + 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleNPCClick(npcs[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        // Close any open modals
        useUIStore.getState().closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [npcs, selectedIndex]);

  const handleNPCClick = async (npc: NPC) => {
    if (npc.type === 'vendor' && npc.shopId) {
      openShop(npc.shopId);
    } else if (npc.dialogueRoot) {
      // For now, we'll create a simple dialogue node
      // In a real implementation, you'd fetch the dialogue node from the server
      const dialogueNode: DialogueNode = {
        id: npc.dialogueRoot,
        npcId: npc.id,
        text: `Hello! I'm ${npc.name}, ${npc.title}.`,
        options: [
          { label: 'Hello!', next: 'end' },
          { label: 'Goodbye', next: 'end' }
        ]
      };
      openDialogue(npc, dialogueNode);
    }
  };

  return (
    <div className="npc-list">
      <h2>Nearby NPCs</h2>
      <div className="npc-grid">
        {npcs.map((npc, index) => (
          <div
            key={npc.id}
            className={`npc-item ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => handleNPCClick(npc)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="npc-avatar">{npc.avatar || '👤'}</div>
            <div className="npc-info">
              <div className="npc-name">{npc.name}</div>
              <div className="npc-title">{npc.title}</div>
              <div className="npc-type">{npc.type}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="npc-instructions">
        Use ↑/↓ to navigate, Enter to select, Esc to close
      </div>
    </div>
  );
};

export default NPCList;
