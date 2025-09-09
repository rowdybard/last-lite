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
        type: 'move',
        direction: 'north'
      });
    });

    it('should parse "go n" to Move(NORTH)', () => {
      const result = parser.parse('go n');
      expect(result).toEqual({
        type: 'move',
        direction: 'north'
      });
    });

    it('should parse all directions', () => {
      expect(parser.parse('go north')).toEqual({ type: 'move', direction: 'north' });
      expect(parser.parse('go south')).toEqual({ type: 'move', direction: 'south' });
      expect(parser.parse('go east')).toEqual({ type: 'move', direction: 'east' });
      expect(parser.parse('go west')).toEqual({ type: 'move', direction: 'west' });
      expect(parser.parse('go n')).toEqual({ type: 'move', direction: 'north' });
      expect(parser.parse('go s')).toEqual({ type: 'move', direction: 'south' });
      expect(parser.parse('go e')).toEqual({ type: 'move', direction: 'east' });
      expect(parser.parse('go w')).toEqual({ type: 'move', direction: 'west' });
    });
  });

  describe('combat commands', () => {
    it('should parse "attack boarling" to Attack command', () => {
      const result = parser.parse('attack boarling');
      expect(result).toEqual({
        type: 'attack',
        target: 'boarling'
      });
    });

    it('should parse "cast whirlwind" to Cast command', () => {
      const result = parser.parse('cast whirlwind');
      expect(result).toEqual({
        type: 'cast',
        ability: 'whirlwind',
        target: undefined
      });
    });

    it('should parse "cast fireburst boarling" to Cast command with target', () => {
      const result = parser.parse('cast fireburst boarling');
      expect(result).toEqual({
        type: 'cast',
        ability: 'fireburst',
        target: 'boarling'
      });
    });
  });

  describe('interaction commands', () => {
    it('should parse "loot" to Loot command', () => {
      const result = parser.parse('loot');
      expect(result).toEqual({
        type: 'loot'
      });
    });

    it('should parse "look" to Look command', () => {
      const result = parser.parse('look');
      expect(result).toEqual({
        type: 'look'
      });
    });

    it('should parse "say hello" to Say command', () => {
      const result = parser.parse('say hello');
      expect(result).toEqual({
        type: 'say',
        message: 'hello'
      });
    });
  });

  describe('invalid commands', () => {
    it('should reject empty commands', () => {
      const result = parser.parse('');
      expect(result).toEqual({
        type: 'error',
        message: 'Empty command'
      });
    });

    it('should reject unknown commands', () => {
      const result = parser.parse('unknown command');
      expect(result).toEqual({
        type: 'error',
        message: 'Unknown command: unknown'
      });
    });

    it('should reject malformed movement commands', () => {
      const result = parser.parse('go invalid');
      expect(result).toEqual({
        type: 'error',
        message: 'Invalid direction: invalid'
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
        type: 'error',
        message: 'Rate limit exceeded'
      });
    });
  });
});
