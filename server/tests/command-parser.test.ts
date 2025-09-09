import { describe, it, expect, beforeEach } from 'vitest';
import { CommandParser } from '../src/systems/command-parser';

describe('CommandParser', () => {
  let parser: CommandParser;

  beforeEach(() => {
    parser = new CommandParser();
  });

  describe('movement commands', () => {
    it('should parse "go north" to Move(NORTH)', () => {
      const result = parser.parse('go north');
      expect(result).toEqual({
        command: 'go',
        type: 'move',
        direction: 'north',
        args: ['north']
      });
    });

    it('should parse "go n" to Move(NORTH)', () => {
      const result = parser.parse('go n');
      expect(result).toEqual({
        command: 'go',
        type: 'move',
        direction: 'north',
        args: ['n']
      });
    });

    it('should parse all directions', () => {
      expect(parser.parse('go north')).toEqual({ command: 'go', type: 'move', direction: 'north', args: ['north'] });
      expect(parser.parse('go south')).toEqual({ command: 'go', type: 'move', direction: 'south', args: ['south'] });
      expect(parser.parse('go east')).toEqual({ command: 'go', type: 'move', direction: 'east', args: ['east'] });
      expect(parser.parse('go west')).toEqual({ command: 'go', type: 'move', direction: 'west', args: ['west'] });
      expect(parser.parse('go n')).toEqual({ command: 'go', type: 'move', direction: 'north', args: ['n'] });
      expect(parser.parse('go s')).toEqual({ command: 'go', type: 'move', direction: 'south', args: ['s'] });
      expect(parser.parse('go e')).toEqual({ command: 'go', type: 'move', direction: 'east', args: ['e'] });
      expect(parser.parse('go w')).toEqual({ command: 'go', type: 'move', direction: 'west', args: ['w'] });
    });
  });

  describe('combat commands', () => {
    it('should parse "attack boarling" to Attack command', () => {
      const result = parser.parse('attack boarling');
      expect(result).toEqual({
        command: 'attack',
        type: 'attack',
        target: 'boarling',
        args: ['boarling']
      });
    });

    it('should parse "cast whirlwind" to Cast command', () => {
      const result = parser.parse('cast whirlwind');
      expect(result).toEqual({
        command: 'cast',
        type: 'cast',
        ability: 'whirlwind',
        target: undefined,
        args: ['whirlwind']
      });
    });

    it('should parse "cast fireburst boarling" to Cast command with target', () => {
      const result = parser.parse('cast fireburst boarling');
      expect(result).toEqual({
        command: 'cast',
        type: 'cast',
        ability: 'fireburst',
        target: 'boarling',
        args: ['fireburst', 'boarling']
      });
    });
  });

  describe('interaction commands', () => {
    it('should parse "loot" to Loot command', () => {
      const result = parser.parse('loot');
      expect(result).toEqual({
        command: 'loot',
        type: 'loot',
        args: []
      });
    });

    it('should parse "look" to Look command', () => {
      const result = parser.parse('look');
      expect(result).toEqual({
        command: 'look',
        type: 'look',
        args: []
      });
    });

    it('should parse "say hello" to Say command', () => {
      const result = parser.parse('say hello');
      expect(result).toEqual({
        command: 'say',
        type: 'say',
        message: 'hello',
        args: ['hello']
      });
    });
  });

  describe('invalid commands', () => {
    it('should reject empty commands', () => {
      const result = parser.parse('');
      expect(result).toEqual({
        command: 'empty',
        type: 'error',
        message: 'Empty command',
        args: []
      });
    });

    it('should reject unknown commands', () => {
      const result = parser.parse('unknown command');
      expect(result).toEqual({
        command: 'unknown',
        type: 'error',
        message: 'Unknown command: unknown',
        args: ['command']
      });
    });

    it('should reject malformed movement commands', () => {
      const result = parser.parse('go invalid');
      expect(result).toEqual({
        command: 'go',
        type: 'error',
        message: 'Invalid direction: invalid',
        args: ['invalid']
      });
    });
  });

  describe('rate limiting', () => {
    it('should reject commands that exceed rate limit', () => {
      // Send 11 commands rapidly (limit is 10/s)
      for (let i = 0; i < 10; i++) {
        parser.parse('look');
      }
      
      const result = parser.parse('look');
      expect(result).toEqual({
        command: 'rate_limit',
        type: 'error',
        message: 'Rate limit exceeded',
        args: []
      });
    });
  });
});
