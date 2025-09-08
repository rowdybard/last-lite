export interface ParsedCommand {
  type: 'move' | 'attack' | 'cast' | 'say' | 'look' | 'loot' | 'help' | 'invalid';
  args: string[];
  target?: string;
  direction?: 'north' | 'south' | 'east' | 'west';
  ability?: string;
  message?: string;
}

export class CommandParser {
  private static readonly MOVE_COMMANDS = ['go', 'move', 'walk'];
  private static readonly DIRECTIONS = ['north', 'south', 'east', 'west', 'n', 's', 'e', 'w'];
  private static readonly ATTACK_COMMANDS = ['attack', 'hit', 'strike'];
  private static readonly CAST_COMMANDS = ['cast', 'use'];
  private static readonly SAY_COMMANDS = ['say', 'tell', 'shout'];
  private static readonly LOOK_COMMANDS = ['look', 'examine', 'inspect'];
  private static readonly LOOT_COMMANDS = ['loot', 'take', 'pickup'];
  private static readonly HELP_COMMANDS = ['help', '?', 'commands'];

  static parse(command: string): ParsedCommand {
    const parts = command.toLowerCase().trim().split(/\s+/);
    if (parts.length === 0) {
      return { type: 'invalid', args: [] };
    }

    const verb = parts[0];
    const args = parts.slice(1);

    // Move commands
    if (this.MOVE_COMMANDS.includes(verb)) {
      if (args.length === 0) {
        return { type: 'invalid', args, message: 'Move where? Try: go north, go south, go east, go west' };
      }
      
      const direction = args[0];
      if (!this.DIRECTIONS.includes(direction)) {
        return { type: 'invalid', args, message: 'Invalid direction. Use: north, south, east, west (or n, s, e, w)' };
      }

      const fullDirection = this.normalizeDirection(direction);
      return { type: 'move', args, direction: fullDirection };
    }

    // Attack commands
    if (this.ATTACK_COMMANDS.includes(verb)) {
      if (args.length === 0) {
        return { type: 'invalid', args, message: 'Attack what? Specify a target.' };
      }
      
      const target = args.join(' ');
      return { type: 'attack', args, target };
    }

    // Cast commands
    if (this.CAST_COMMANDS.includes(verb)) {
      if (args.length === 0) {
        return { type: 'invalid', args, message: 'Cast what? Specify an ability.' };
      }
      
      const ability = args[0];
      const target = args.length > 1 ? args.slice(1).join(' ') : undefined;
      return { type: 'cast', args, ability, target };
    }

    // Say commands
    if (this.SAY_COMMANDS.includes(verb)) {
      if (args.length === 0) {
        return { type: 'invalid', args, message: 'Say what? Provide a message.' };
      }
      
      const message = args.join(' ');
      return { type: 'say', args, message };
    }

    // Look commands
    if (this.LOOK_COMMANDS.includes(verb)) {
      return { type: 'look', args };
    }

    // Loot commands
    if (this.LOOT_COMMANDS.includes(verb)) {
      return { type: 'loot', args };
    }

    // Help commands
    if (this.HELP_COMMANDS.includes(verb)) {
      return { type: 'help', args };
    }

    return { type: 'invalid', args, message: 'Unknown command. Type "help" for available commands.' };
  }

  private static normalizeDirection(direction: string): 'north' | 'south' | 'east' | 'west' {
    switch (direction) {
      case 'n': return 'north';
      case 's': return 'south';
      case 'e': return 'east';
      case 'w': return 'west';
      default: return direction as 'north' | 'south' | 'east' | 'west';
    }
  }

  static getHelpText(): string {
    return `
Available commands:
- go <direction> - Move in a direction (north, south, east, west)
- attack <target> - Attack a target
- cast <ability> [target] - Cast an ability
- say <message> - Send a message to nearby players
- look - Examine your surroundings
- loot - Pick up nearby items
- help - Show this help text

Examples:
- go north
- attack boar
- cast fireburst goblin
- say hello everyone
- look
- loot
`;
  }
}