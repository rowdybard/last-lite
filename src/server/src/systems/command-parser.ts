export interface ParsedCommand {
  type: 'move' | 'attack' | 'cast' | 'loot' | 'look' | 'say' | 'error';
  direction?: 'north' | 'south' | 'east' | 'west';
  target?: string;
  ability?: string;
  message?: string;
  error?: string;
}

export class CommandParser {
  private commandHistory: number[] = [];
  private readonly RATE_LIMIT = 10; // commands per second
  private readonly RATE_WINDOW = 1000; // 1 second

  parse(input: string): ParsedCommand {
    // Rate limiting
    if (!this.checkRateLimit()) {
      return {
        type: 'error',
        message: 'Rate limit exceeded'
      };
    }

    const trimmed = input.trim().toLowerCase();
    
    if (!trimmed) {
      return {
        type: 'error',
        message: 'Empty command'
      };
    }

    const parts = trimmed.split(' ');
    const command = parts[0];

    switch (command) {
      case 'go':
        return this.parseMovement(parts);
      case 'attack':
        return this.parseAttack(parts);
      case 'cast':
        return this.parseCast(parts);
      case 'loot':
        return { type: 'loot' };
      case 'look':
        return { type: 'look' };
      case 'say':
        return this.parseSay(parts);
      default:
        return {
          type: 'error',
          message: `Unknown command: ${command}`
        };
    }
  }

  private parseMovement(parts: string[]): ParsedCommand {
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

  private parseAttack(parts: string[]): ParsedCommand {
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

  private parseCast(parts: string[]): ParsedCommand {
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

  private parseSay(parts: string[]): ParsedCommand {
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
}
