import React, { useState, useEffect } from 'react';
import { DialogueNode } from '../types/game';
import { useUIStore } from '../state/useUIStore';
import { usePlayerStore } from '../state/usePlayerStore';
import { dialogueAPI } from '../api/dialogue';

const DialogueModal: React.FC = () => {
  const { selectedNPC, currentDialogueNode, setCurrentDialogueNode, closeModal } = useUIStore();
  const { setPlayer } = usePlayerStore();
  const [selectedOption, setSelectedOption] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedOption(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedOption(prev => Math.min((currentDialogueNode?.options.length || 1) - 1, prev + 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleOptionSelect(selectedOption);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOption, currentDialogueNode, closeModal]);

  const handleOptionSelect = async (optionIndex: number) => {
    if (!currentDialogueNode) return;

    const option = currentDialogueNode.options[optionIndex];
    if (!option) return;

    setLoading(true);

    try {
      const response = await dialogueAPI.advance(currentDialogueNode.id, optionIndex);
      
      if (response.ok && response.data) {
        // Update player state
        setPlayer(response.data.player);

        if (response.data.nextNode === 'end') {
          closeModal();
        } else {
          // In a real implementation, you'd fetch the next dialogue node
          // For now, we'll just close the modal
          closeModal();
        }
      } else {
        console.error('Dialogue error:', response.error);
      }
    } catch (error) {
      console.error('Failed to advance dialogue:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedNPC || !currentDialogueNode) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="dialogue-modal">
        <div className="dialogue-header">
          <div className="npc-info">
            <span className="npc-avatar">{selectedNPC.avatar || '👤'}</span>
            <div>
              <div className="npc-name">{selectedNPC.name}</div>
              <div className="npc-title">{selectedNPC.title}</div>
            </div>
          </div>
          <button className="close-button" onClick={closeModal}>×</button>
        </div>

        <div className="dialogue-content">
          <p className="dialogue-text">{currentDialogueNode.text}</p>
          
          <div className="dialogue-options">
            {currentDialogueNode.options.map((option, index) => (
              <button
                key={index}
                className={`dialogue-option ${index === selectedOption ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(index)}
                disabled={loading}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="loading">Processing...</div>}
      </div>
    </div>
  );
};

export default DialogueModal;
