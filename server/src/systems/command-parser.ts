export interface ParsedCommand {
  command: string;
  type: 'move' | 'attack' | 'cast' | 'loot' | 'look' | 'say' | 'inventory' | 'inv' | 'vendor' | 'buy' | 'sell' | 'quest' | 'pet' | 'help' | 'error';
  direction?: 'north' | 'south' | 'east' | 'west';
  target?: string;
  ability?: string;
  message?: string;
  error?: string;
  args?: string[];
  questAction?: 'list' | 'start' | 'status' | 'abandon';
  questId?: string;
  petAction?: 'list' | 'adopt' | 'summon' | 'dismiss' | 'use' | 'status';
  petType?: string;
  petName?: string;
  petId?: string;
}

export class CommandParser {
  private commandHistory: number[] = [];
  private readonly RATE_LIMIT = 10; // commands per second
  private readonly RATE_WINDOW = 1000; // 1 second

  parse(input: string): ParsedCommand {
    // Rate limiting
    if (!this.checkRateLimit()) {
      return {
        command: 'rate_limit',
        type: 'error',
        message: 'Rate limit exceeded',
        args: []
      };
    }

    const trimmed = input.trim().toLowerCase();
    
    if (!trimmed) {
      return {
        command: 'empty',
        type: 'error',
        message: 'Empty command',
        args: []
      };
    }

    const parts = trimmed.split(' ');
    const command = parts[0];
    const args = parts.slice(1);

    switch (command) {
      case 'go':
        return { ...this.parseMovement(parts), command, args };
      case 'attack':
        return { ...this.parseAttack(parts), command, args };
      case 'cast':
        return { ...this.parseCast(parts), command, args };
      case 'loot':
        return { command, type: 'loot', args };
      case 'look':
        return { command, type: 'look', args };
      case 'say':
        return { ...this.parseSay(parts), command, args };
      case 'inventory':
      case 'inv':
        return { command, type: command as 'inventory' | 'inv', args };
      case 'vendor':
        return { command, type: 'vendor', args };
      case 'buy':
        return { command, type: 'buy', args };
      case 'sell':
        return { command, type: 'sell', args };
      case 'quest':
        return { ...this.parseQuest(parts), command, args };
      case 'pet':
        return { ...this.parsePet(parts), command, args };
      case 'help':
        return { command, type: 'help', args };
      default:
        return {
          command,
          type: 'error',
          message: `Unknown command: ${command}`,
          args
        };
    }
  }

  private parseMovement(parts: string[]): Omit<ParsedCommand, 'command' | 'args'> {
    if (parts.length < 2) {
      return {
        type: 'error',
        message: 'Movement command requires direction'
      };
    }

    const direction = parts[1];
    const directionMap: Record<string, 'north' | 'south' | 'east' | 'west'> = {
      'north': 'north',
      'n': 'north',
      'south': 'south',
      's': 'south',
      'east': 'east',
      'e': 'east',
      'west': 'west',
      'w': 'west'
    };

    const mappedDirection = directionMap[direction];
    if (!mappedDirection) {
      return {
        type: 'error',
        message: `Invalid direction: ${direction}`
      };
    }

    return {
      type: 'move',
      direction: mappedDirection
    };
  }

  private parseAttack(parts: string[]): Omit<ParsedCommand, 'command' | 'args'> {
    if (parts.length < 2) {
      return {
        type: 'error',
        message: 'Attack command requires target'
      };
    }

    const target = parts.slice(1).join(' ');
    return {
      type: 'attack',
      target
    };
  }

  private parseCast(parts: string[]): Omit<ParsedCommand, 'command' | 'args'> {
    if (parts.length < 2) {
      return {
        type: 'error',
        message: 'Cast command requires ability name'
      };
    }

    const ability = parts[1];
    const target = parts.length > 2 ? parts.slice(2).join(' ') : undefined;

    return {
      type: 'cast',
      ability,
      target
    };
  }

  private parseSay(parts: string[]): Omit<ParsedCommand, 'command' | 'args'> {
    if (parts.length < 2) {
      return {
        type: 'error',
        message: 'Say command requires message'
      };
    }

    const message = parts.slice(1).join(' ');
    return {
      type: 'say',
      message
    };
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    
    // Remove old commands outside the rate window
    this.commandHistory = this.commandHistory.filter(
      timestamp => now - timestamp < this.RATE_WINDOW
    );

    // Check if we're at the limit
    if (this.commandHistory.length >= this.RATE_LIMIT) {
      return false;
    }

    // Add current command
    this.commandHistory.push(now);
    return true;
  }

  private parseQuest(parts: string[]): Omit<ParsedCommand, 'command' | 'args'> {
    if (parts.length < 2) {
      return {
        type: 'quest',
        questAction: 'list'
      };
    }

    const action = parts[1];
    const questId = parts.length > 2 ? parts[2] : undefined;

    switch (action) {
      case 'list':
        return {
          type: 'quest',
          questAction: 'list'
        };
      case 'start':
        if (!questId) {
          return {
            type: 'error',
            message: 'Quest start requires quest ID'
          };
        }
        return {
          type: 'quest',
          questAction: 'start',
          questId
        };
      case 'status':
        return {
          type: 'quest',
          questAction: 'status'
        };
      case 'abandon':
        if (!questId) {
          return {
            type: 'error',
            message: 'Quest abandon requires quest ID'
          };
        }
        return {
          type: 'quest',
          questAction: 'abandon',
          questId
        };
      default:
        return {
          type: 'error',
          message: `Unknown quest action: ${action}`
        };
    }
  }

  private parsePet(parts: string[]): Omit<ParsedCommand, 'command' | 'args'> {
    if (parts.length < 2) {
      return {
        type: 'pet',
        petAction: 'list'
      };
    }

    const action = parts[1];

    switch (action) {
      case 'list':
        return {
          type: 'pet',
          petAction: 'list'
        };
      case 'adopt':
        if (parts.length < 4) {
          return {
            type: 'error',
            message: 'Pet adopt requires type and name (e.g., "pet adopt wolf Fluffy")'
          };
        }
        return {
          type: 'pet',
          petAction: 'adopt',
          petType: parts[2],
          petName: parts.slice(3).join(' ')
        };
      case 'summon':
        if (parts.length < 3) {
          return {
            type: 'error',
            message: 'Pet summon requires pet ID'
          };
        }
        return {
          type: 'pet',
          petAction: 'summon',
          petId: parts[2]
        };
      case 'dismiss':
        if (parts.length < 3) {
          return {
            type: 'error',
            message: 'Pet dismiss requires pet ID'
          };
        }
        return {
          type: 'pet',
          petAction: 'dismiss',
          petId: parts[2]
        };
      case 'use':
        if (parts.length < 4) {
          return {
            type: 'error',
            message: 'Pet use requires pet ID and ability (e.g., "pet use pet123 bite")'
          };
        }
        return {
          type: 'pet',
          petAction: 'use',
          petId: parts[2],
          ability: parts[3]
        };
      case 'status':
        return {
          type: 'pet',
          petAction: 'status'
        };
      default:
        return {
          type: 'error',
          message: `Unknown pet action: ${action}`
        };
    }
  }
}
