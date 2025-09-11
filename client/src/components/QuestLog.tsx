import React, { useState, useEffect } from 'react';
import { Quest, PlayerState } from '../types/game';
import { useUIStore } from '../state/useUIStore';
import { usePlayerStore } from '../state/usePlayerStore';
import { questAPI } from '../api/quest';

const QuestLog: React.FC = () => {
  const { closeModal } = useUIStore();
  const { player, setPlayer } = usePlayerStore();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuests();
  }, []);

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

  const loadQuests = async () => {
    try {
      const response = await questAPI.getAll();
      if (response.ok && response.data) {
        setQuests(response.data);
      } else {
        setError(response.error || 'Failed to load quests');
      }
    } catch (err) {
      setError('Failed to load quests');
    }
  };

  const getQuestState = (questId: string): string => {
    if (!player) return 'NotStarted';
    const quest = player.questLog.find(q => q.questId === questId);
    return quest ? quest.state : 'NotStarted';
  };

  const getQuestProgress = (questId: string): Record<string, number> => {
    if (!player) return {};
    const quest = player.questLog.find(q => q.questId === questId);
    return quest ? quest.progress : {};
  };

  const getItemCount = (itemId: string): number => {
    if (!player) return 0;
    const item = player.inventory.find(i => i.itemId === itemId);
    return item ? item.qty : 0;
  };

  return (
    <div className="modal-overlay">
      <div className="quest-log-modal">
        <div className="quest-header">
          <h2>Quest Log</h2>
          <button className="close-button" onClick={closeModal}>×</button>
        </div>

        <div className="quest-content">
          {quests.map((quest) => {
            const state = getQuestState(quest.id);
            const progress = getQuestProgress(quest.id);

            return (
              <div key={quest.id} className={`quest-item ${state.toLowerCase()}`}>
                <div className="quest-title">{quest.title}</div>
                <div className="quest-summary">{quest.summary}</div>
                <div className="quest-state">Status: {state}</div>
                
                {state === 'InProgress' && (
                  <div className="quest-objectives">
                    {quest.objectives.map((objective, index) => {
                      if (objective.type === 'collect' && objective.itemId && objective.qty) {
                        const current = getItemCount(objective.itemId);
                        const required = objective.qty;
                        const progressPercent = Math.min(100, (current / required) * 100);

                        return (
                          <div key={index} className="objective">
                            <div className="objective-text">
                              Collect {required} {objective.itemId}: {current}/{required}
                            </div>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}

                {state === 'Completed' && (
                  <div className="quest-rewards">
                    <div>Rewards: {quest.rewards.gold} gold, {quest.rewards.xp} XP</div>
                    {quest.rewards.items && quest.rewards.items.length > 0 && (
                      <div>
                        Items: {quest.rewards.items.map(item => `${item.qty} ${item.itemId}`).join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
};

export default QuestLog;
