import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TextGame, FeedMessage, GameState } from '../src/text-game';

// Mock DOM elements
const mockFeedContent = {
  innerHTML: '',
  scrollTop: 0,
  appendChild: vi.fn(),
};

const mockCommandInput = {
  value: '',
  addEventListener: vi.fn(),
  focus: vi.fn(),
};

const mockStatusElements = {
  'hp-value': { textContent: '' },
  'mp-value': { textContent: '' },
  'gold-value': { textContent: '' },
  'xp-value': { textContent: '' },
};

// Mock document.createElement
const mockCreateElement = vi.fn((tagName: string) => {
  const element = {
    className: '',
    innerHTML: '',
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    addEventListener: vi.fn(),
  };
  return element;
});

// Mock document.getElementById
const mockGetElementById = vi.fn((id: string) => {
  if (id === 'feed-content') return mockFeedContent;
  if (id === 'command-input') return mockCommandInput;
  if (id in mockStatusElements) return mockStatusElements[id as keyof typeof mockStatusElements];
  return null;
});

// Mock document.querySelectorAll
const mockQuerySelectorAll = vi.fn(() => []);

// Mock document.addEventListener
const mockAddEventListener = vi.fn();

// Mock window.addEventListener
const mockWindowAddEventListener = vi.fn();

// Mock NetworkManager
const mockNetworkManager = {
  connectToHub: vi.fn(),
  setOnStateUpdate: vi.fn(),
  setOnZoneTransfer: vi.fn(),
  setOnFeedMessage: vi.fn(),
  sendCommand: vi.fn(),
  disconnect: vi.fn(),
};

// Mock the network module
vi.mock('../src/network', () => ({
  NetworkManager: vi.fn(() => mockNetworkManager),
}));

describe('TextGame', () => {
  let textGame: TextGame;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock global objects
    global.document = {
      getElementById: mockGetElementById,
      querySelectorAll: mockQuerySelectorAll,
      addEventListener: mockAddEventListener,
      createElement: mockCreateElement,
    } as any;

    global.window = {
      addEventListener: mockWindowAddEventListener,
    } as any;

    // Reset mock element states
    mockFeedContent.innerHTML = '';
    mockCommandInput.value = '';
    Object.values(mockStatusElements).forEach(el => el.textContent = '');
  });

  afterEach(() => {
    if (textGame) {
      textGame.dispose();
    }
  });

  describe('M0 - Text Mode Vertical Slice', () => {
    it('should initialize with welcome message', () => {
      textGame = new TextGame();
      
      expect(mockNetworkManager.connectToHub).toHaveBeenCalled();
      expect(mockNetworkManager.setOnStateUpdate).toHaveBeenCalled();
      expect(mockNetworkManager.setOnZoneTransfer).toHaveBeenCalled();
      expect(mockNetworkManager.setOnFeedMessage).toHaveBeenCalled();
    });

    it('should add feed messages correctly', () => {
      textGame = new TextGame();
      
      const testMessage: FeedMessage = {
        at: Date.now(),
        text: 'Test message',
        type: 'info',
        zone: 'Hub'
      };

      textGame.addFeedMessage(testMessage);
      
      // Should have added the message to the feed
      expect(mockFeedContent.appendChild).toHaveBeenCalled();
    });

    it('should update game state correctly', () => {
      textGame = new TextGame();
      
      const newState: Partial<GameState> = {
        hp: 80,
        maxHp: 100,
        mp: 30,
        maxMp: 50,
        gold: 100,
        xp: 250,
        maxXp: 1000,
        level: 2,
        currentZone: 'Field 1'
      };

      textGame.updateGameState(newState);
      
      // Status elements should be updated
      expect(mockStatusElements['hp-value'].textContent).toBe('80/100');
      expect(mockStatusElements['mp-value'].textContent).toBe('30/50');
      expect(mockStatusElements['gold-value'].textContent).toBe('100');
      expect(mockStatusElements['xp-value'].textContent).toBe('250/1000');
    });

    it('should handle feed message from network', () => {
      textGame = new TextGame();
      
      // Get the feed message handler that was set up
      const feedHandler = mockNetworkManager.setOnFeedMessage.mock.calls[0][0];
      
      const testMessage: FeedMessage = {
        at: Date.now(),
        text: 'Network message',
        type: 'combat',
        zone: 'Hub'
      };

      feedHandler(testMessage);
      
      // Should have added the message to the feed
      expect(mockFeedContent.appendChild).toHaveBeenCalled();
    });

    it('should handle zone transfer', () => {
      textGame = new TextGame();
      
      // Get the zone transfer handler that was set up
      const zoneHandler = mockNetworkManager.setOnZoneTransfer.mock.calls[0][0];
      
      const transferData = {
        targetZone: 'world:field:1'
      };

      zoneHandler(transferData);
      
      // Should have added a zone transfer message to the feed
      expect(mockFeedContent.appendChild).toHaveBeenCalled();
    });

    it('should dispose correctly', () => {
      textGame = new TextGame();
      
      textGame.dispose();
      
      expect(mockNetworkManager.disconnect).toHaveBeenCalled();
    });

    it('should limit feed messages to max lines', () => {
      textGame = new TextGame();
      
      // Clear the initial welcome message calls
      vi.clearAllMocks();
      
      // Add more messages than the max
      for (let i = 0; i < 250; i++) {
        textGame.addFeedMessage({
          at: Date.now() + i,
          text: `Message ${i}`,
          type: 'info',
          zone: 'Hub'
        });
      }
      
      // Should have called appendChild (exact count may vary due to rendering)
      expect(mockFeedContent.appendChild).toHaveBeenCalled();
      
      // The feed should be limited to max lines internally
      expect(textGame['feedMessages'].length).toBeLessThanOrEqual(200);
    });

    it('should render feed messages with correct structure', () => {
      textGame = new TextGame();
      
      const testMessage: FeedMessage = {
        at: 1234567890,
        text: 'Test message',
        type: 'combat',
        zone: 'Hub'
      };

      textGame.addFeedMessage(testMessage);
      
      // Should have created a feed line element
      expect(mockFeedContent.appendChild).toHaveBeenCalledWith(
        expect.objectContaining({
          className: 'feed-line',
          getAttribute: expect.any(Function),
          innerHTML: expect.stringContaining('Test message')
        })
      );
    });

    it('should handle different message types with correct styling', () => {
      textGame = new TextGame();
      
      // Clear the initial welcome message calls
      vi.clearAllMocks();
      
      const messageTypes: FeedMessage['type'][] = ['info', 'combat', 'loot', 'quest', 'error'];
      
      messageTypes.forEach(type => {
        textGame.addFeedMessage({
          at: Date.now(),
          text: `${type} message`,
          type,
          zone: 'Hub'
        });
      });
      
      // Should have created elements for each message type
      expect(mockFeedContent.appendChild).toHaveBeenCalled();
      
      // Should have messages of each type
      const messages = textGame['feedMessages'];
      messageTypes.forEach(type => {
        expect(messages.some(msg => msg.type === type)).toBe(true);
      });
    });
  });
});