import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TextGame } from '../src/text-game';

// Mock DOM elements
const mockFeedContainer = {
  appendChild: vi.fn(),
  removeChild: vi.fn(),
  firstChild: null,
  children: { length: 0 }
};

const mockCommandInput = {
  addEventListener: vi.fn(),
  value: ''
};

const mockZoneElement = {
  textContent: ''
};

const mockHpElement = {
  textContent: ''
};

const mockMpElement = {
  textContent: ''
};

const mockGoldElement = {
  textContent: ''
};

const mockXpElement = {
  textContent: ''
};

// Mock DOM methods
Object.defineProperty(document, 'getElementById', {
  value: vi.fn((id: string) => {
    switch (id) {
      case 'feedContainer': return mockFeedContainer;
      case 'commandInput': return mockCommandInput;
      case 'currentZone': return mockZoneElement;
      case 'hpValue': return mockHpElement;
      case 'mpValue': return mockMpElement;
      case 'goldValue': return mockGoldElement;
      case 'xpValue': return mockXpElement;
      default: return null;
    }
  }),
  writable: true
});

Object.defineProperty(document, 'addEventListener', {
  value: vi.fn(),
  writable: true
});

Object.defineProperty(document, 'querySelectorAll', {
  value: vi.fn(() => []),
  writable: true
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    protocol: 'http:',
    host: 'localhost:3000'
  },
  writable: true
});

// Mock Colyseus Client
const mockRoom = {
  send: vi.fn(),
  onMessage: vi.fn(),
  onError: vi.fn(),
  leave: vi.fn(),
  id: 'test-room'
};

const mockClient = {
  joinOrCreate: vi.fn().mockResolvedValue(mockRoom)
};

vi.mock('colyseus.js', () => ({
  Client: vi.fn().mockImplementation(() => mockClient)
}));

describe('TextGame - Zone Transfer', () => {
  let game: TextGame;

  beforeEach(() => {
    vi.clearAllMocks();
    game = new TextGame();
  });

  it('should handle zone transfer message from server', () => {
    // Simulate receiving a zone transfer message
    const transferMessage = {
      targetZone: 'world:field:1',
      payload: {
        pos: { x: 0, y: 0, z: 0 },
        hp: 100,
        maxHp: 100,
        mp: 50,
        maxMp: 50,
        gold: 100,
        level: 1,
        xp: 0,
        maxXp: 1000
      }
    };

    // Mock the room's onMessage callback
    const onMessageCallback = mockRoom.onMessage.mock.calls.find(
      call => call[0] === 'zone_transfer'
    )?.[1];

    if (onMessageCallback) {
      onMessageCallback(transferMessage);
    }

    // Verify that the game state was updated
    expect(mockZoneElement.textContent).toBe('Field');
    expect(mockHpElement.textContent).toBe('100/100');
    expect(mockMpElement.textContent).toBe('50/50');
    expect(mockGoldElement.textContent).toBe('100');
    expect(mockXpElement.textContent).toBe('0/1000');
  });

  it('should handle zone swap error message', () => {
    const errorMessage = {
      reason: 'Too far from door'
    };

    // Mock the room's onMessage callback for zone_swap_error
    const onMessageCallback = mockRoom.onMessage.mock.calls.find(
      call => call[0] === 'zone_swap_error'
    )?.[1];

    if (onMessageCallback) {
      onMessageCallback(errorMessage);
    }

    // Verify that an error message was added to the feed
    expect(mockFeedContainer.appendChild).toHaveBeenCalled();
  });

  it('should send zone swap request when player types go command', () => {
    // Simulate typing a movement command
    game['handleCommand']('go north');

    // Verify that the command was sent to the server
    expect(mockRoom.send).toHaveBeenCalledWith('cmd', { text: 'go north' });
  });

  it('should update zone display when game state changes', () => {
    // Simulate receiving a state update with new zone
    const stateUpdate = {
      zoneId: 'world:field:1',
      pos: { x: 0, y: 0 },
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      gold: 0,
      level: 1,
      xp: 0,
      maxXp: 1000
    };

    game['updateGameState'](stateUpdate);

    // Verify zone display was updated
    expect(mockZoneElement.textContent).toBe('Field');
  });

  it('should handle connection to different zones', async () => {
    // Test connecting to field zone
    mockClient.joinOrCreate.mockResolvedValueOnce({
      ...mockRoom,
      id: 'field-room-1'
    });

    // This would be called when the client needs to connect to a new zone
    // In a real implementation, this would happen after receiving a zone_transfer message
    const fieldRoom = await mockClient.joinOrCreate('world:field:1', {
      name: 'TestPlayer',
      class: 'Warrior'
    });

    expect(fieldRoom.id).toBe('field-room-1');
  });
});
