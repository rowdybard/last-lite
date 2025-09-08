import { describe, it, expect } from 'vitest';
import { CommandParser, ParsedCommand } from '../src/systems/command-parser.js';

describe('CommandParser', () => {
  describe('M0 - Text Mode Vertical Slice', () => {
    it('should parse move commands correctly', () => {
      const testCases = [
        { input: 'go north', expected: { type: 'move', direction: 'north' } },
        { input: 'go south', expected: { type: 'move', direction: 'south' } },
        { input: 'go east', expected: { type: 'move', direction: 'east' } },
        { input: 'go west', expected: { type: 'move', direction: 'west' } },
        { input: 'go n', expected: { type: 'move', direction: 'north' } },
        { input: 'go s', expected: { type: 'move', direction: 'south' } },
        { input: 'go e', expected: { type: 'move', direction: 'east' } },
        { input: 'go w', expected: { type: 'move', direction: 'west' } },
        { input: 'move north', expected: { type: 'move', direction: 'north' } },
        { input: 'walk south', expected: { type: 'move', direction: 'south' } },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = CommandParser.parse(input);
        expect(result.type).toBe(expected.type);
        expect(result.direction).toBe(expected.direction);
      });
    });

    it('should parse attack commands correctly', () => {
      const testCases = [
        { input: 'attack boar', expected: { type: 'attack', target: 'boar' } },
        { input: 'attack goblin warrior', expected: { type: 'attack', target: 'goblin warrior' } },
        { input: 'hit skeleton', expected: { type: 'attack', target: 'skeleton' } },
        { input: 'strike dragon', expected: { type: 'attack', target: 'dragon' } },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = CommandParser.parse(input);
        expect(result.type).toBe(expected.type);
        expect(result.target).toBe(expected.target);
      });
    });

    it('should parse cast commands correctly', () => {
      const testCases = [
        { input: 'cast fireburst', expected: { type: 'cast', ability: 'fireburst' } },
        { input: 'cast heal player', expected: { type: 'cast', ability: 'heal', target: 'player' } },
        { input: 'use lightning bolt goblin', expected: { type: 'cast', ability: 'lightning', target: 'bolt goblin' } },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = CommandParser.parse(input);
        expect(result.type).toBe(expected.type);
        expect(result.ability).toBe(expected.ability);
        if (expected.target) {
          expect(result.target).toBe(expected.target);
        }
      });
    });

    it('should parse say commands correctly', () => {
      const testCases = [
        { input: 'say hello', expected: { type: 'say', message: 'hello' } },
        { input: 'say hello everyone', expected: { type: 'say', message: 'hello everyone' } },
        { input: 'tell party ready', expected: { type: 'say', message: 'party ready' } },
        { input: 'shout danger ahead', expected: { type: 'say', message: 'danger ahead' } },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = CommandParser.parse(input);
        expect(result.type).toBe(expected.type);
        expect(result.message).toBe(expected.message);
      });
    });

    it('should parse utility commands correctly', () => {
      expect(CommandParser.parse('look')).toEqual({ type: 'look', args: [] });
      expect(CommandParser.parse('examine')).toEqual({ type: 'look', args: [] });
      expect(CommandParser.parse('inspect')).toEqual({ type: 'look', args: [] });
      
      expect(CommandParser.parse('loot')).toEqual({ type: 'loot', args: [] });
      expect(CommandParser.parse('take')).toEqual({ type: 'loot', args: [] });
      expect(CommandParser.parse('pickup')).toEqual({ type: 'loot', args: [] });
      
      expect(CommandParser.parse('help')).toEqual({ type: 'help', args: [] });
      expect(CommandParser.parse('?')).toEqual({ type: 'help', args: [] });
      expect(CommandParser.parse('commands')).toEqual({ type: 'help', args: [] });
    });

    it('should handle invalid commands', () => {
      const testCases = [
        'go',
        'attack',
        'cast',
        'say',
        'invalid command',
        'go invalid',
        'unknown verb',
      ];

      testCases.forEach(input => {
        const result = CommandParser.parse(input);
        expect(result.type).toBe('invalid');
        expect(result.message).toBeDefined();
      });
    });

    it('should provide help text', () => {
      const helpText = CommandParser.getHelpText();
      expect(helpText).toContain('Available commands:');
      expect(helpText).toContain('go <direction>');
      expect(helpText).toContain('attack <target>');
      expect(helpText).toContain('cast <ability>');
      expect(helpText).toContain('say <message>');
      expect(helpText).toContain('look');
      expect(helpText).toContain('loot');
      expect(helpText).toContain('help');
    });

    it('should handle case insensitive commands', () => {
      const testCases = [
        'GO NORTH',
        'Go North',
        'gO nOrTh',
        'ATTACK BOAR',
        'Attack Boar',
        'CAST FIREBURST',
        'Cast Fireburst',
      ];

      testCases.forEach(input => {
        const result = CommandParser.parse(input);
        expect(result.type).not.toBe('invalid');
      });
    });

    it('should handle extra whitespace', () => {
      const testCases = [
        '  go north  ',
        '  attack boar  ',
        '  cast fireburst  ',
        '  say hello  ',
      ];

      testCases.forEach(input => {
        const result = CommandParser.parse(input);
        expect(result.type).not.toBe('invalid');
      });
    });
  });
});