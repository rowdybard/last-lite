import { describe, it, expect, beforeEach } from 'vitest';
import { CommandParser } from '../src/systems/command-parser';

describe('CommandParser - Quest and Pet Commands', () => {
  let parser: CommandParser;

  beforeEach(() => {
    parser = new CommandParser();
  });

  describe('Quest Commands', () => {
    it('should parse quest list command', () => {
      const result = parser.parse('quest list');
      expect(result).toEqual({
        command: 'quest',
        type: 'quest',
        questAction: 'list',
        args: ['list']
      });
    });

    it('should parse quest list as default when no action specified', () => {
      const result = parser.parse('quest');
      expect(result).toEqual({
        command: 'quest',
        type: 'quest',
        questAction: 'list',
        args: []
      });
    });

    it('should parse quest start command', () => {
      const result = parser.parse('quest start ftue_welcome');
      expect(result).toEqual({
        command: 'quest',
        type: 'quest',
        questAction: 'start',
        questId: 'ftue_welcome',
        args: ['start', 'ftue_welcome']
      });
    });

    it('should parse quest status command', () => {
      const result = parser.parse('quest status');
      expect(result).toEqual({
        command: 'quest',
        type: 'quest',
        questAction: 'status',
        args: ['status']
      });
    });

    it('should parse quest abandon command', () => {
      const result = parser.parse('quest abandon ftue_welcome');
      expect(result).toEqual({
        command: 'quest',
        type: 'quest',
        questAction: 'abandon',
        questId: 'ftue_welcome',
        args: ['abandon', 'ftue_welcome']
      });
    });

    it('should return error for quest start without quest ID', () => {
      const result = parser.parse('quest start');
      expect(result).toEqual({
        command: 'quest',
        type: 'error',
        message: 'Quest start requires quest ID',
        args: ['start']
      });
    });

    it('should return error for quest abandon without quest ID', () => {
      const result = parser.parse('quest abandon');
      expect(result).toEqual({
        command: 'quest',
        type: 'error',
        message: 'Quest abandon requires quest ID',
        args: ['abandon']
      });
    });

    it('should return error for unknown quest action', () => {
      const result = parser.parse('quest invalid');
      expect(result).toEqual({
        command: 'quest',
        type: 'error',
        message: 'Unknown quest action: invalid',
        args: ['invalid']
      });
    });
  });

  describe('Pet Commands', () => {
    it('should parse pet list command', () => {
      const result = parser.parse('pet list');
      expect(result).toEqual({
        command: 'pet',
        type: 'pet',
        petAction: 'list',
        args: ['list']
      });
    });

    it('should parse pet list as default when no action specified', () => {
      const result = parser.parse('pet');
      expect(result).toEqual({
        command: 'pet',
        type: 'pet',
        petAction: 'list',
        args: []
      });
    });

    it('should parse pet adopt command', () => {
      const result = parser.parse('pet adopt wolf Fluffy');
      expect(result).toEqual({
        command: 'pet',
        type: 'pet',
        petAction: 'adopt',
        petType: 'wolf',
        petName: 'fluffy',
        args: ['adopt', 'wolf', 'fluffy']
      });
    });

    it('should parse pet adopt command with multi-word name', () => {
      const result = parser.parse('pet adopt cat Sir Whiskers');
      expect(result).toEqual({
        command: 'pet',
        type: 'pet',
        petAction: 'adopt',
        petType: 'cat',
        petName: 'sir whiskers',
        args: ['adopt', 'cat', 'sir', 'whiskers']
      });
    });

    it('should parse pet summon command', () => {
      const result = parser.parse('pet summon pet123');
      expect(result).toEqual({
        command: 'pet',
        type: 'pet',
        petAction: 'summon',
        petId: 'pet123',
        args: ['summon', 'pet123']
      });
    });

    it('should parse pet dismiss command', () => {
      const result = parser.parse('pet dismiss pet123');
      expect(result).toEqual({
        command: 'pet',
        type: 'pet',
        petAction: 'dismiss',
        petId: 'pet123',
        args: ['dismiss', 'pet123']
      });
    });

    it('should parse pet use command', () => {
      const result = parser.parse('pet use pet123 bite');
      expect(result).toEqual({
        command: 'pet',
        type: 'pet',
        petAction: 'use',
        petId: 'pet123',
        ability: 'bite',
        args: ['use', 'pet123', 'bite']
      });
    });

    it('should parse pet status command', () => {
      const result = parser.parse('pet status');
      expect(result).toEqual({
        command: 'pet',
        type: 'pet',
        petAction: 'status',
        args: ['status']
      });
    });

    it('should return error for pet adopt without type and name', () => {
      const result = parser.parse('pet adopt');
      expect(result).toEqual({
        command: 'pet',
        type: 'error',
        message: 'Pet adopt requires type and name (e.g., "pet adopt wolf Fluffy")',
        args: ['adopt']
      });
    });

    it('should return error for pet adopt without name', () => {
      const result = parser.parse('pet adopt wolf');
      expect(result).toEqual({
        command: 'pet',
        type: 'error',
        message: 'Pet adopt requires type and name (e.g., "pet adopt wolf Fluffy")',
        args: ['adopt', 'wolf']
      });
    });

    it('should return error for pet summon without pet ID', () => {
      const result = parser.parse('pet summon');
      expect(result).toEqual({
        command: 'pet',
        type: 'error',
        message: 'Pet summon requires pet ID',
        args: ['summon']
      });
    });

    it('should return error for pet dismiss without pet ID', () => {
      const result = parser.parse('pet dismiss');
      expect(result).toEqual({
        command: 'pet',
        type: 'error',
        message: 'Pet dismiss requires pet ID',
        args: ['dismiss']
      });
    });

    it('should return error for pet use without pet ID and ability', () => {
      const result = parser.parse('pet use');
      expect(result).toEqual({
        command: 'pet',
        type: 'error',
        message: 'Pet use requires pet ID and ability (e.g., "pet use pet123 bite")',
        args: ['use']
      });
    });

    it('should return error for pet use without ability', () => {
      const result = parser.parse('pet use pet123');
      expect(result).toEqual({
        command: 'pet',
        type: 'error',
        message: 'Pet use requires pet ID and ability (e.g., "pet use pet123 bite")',
        args: ['use', 'pet123']
      });
    });

    it('should return error for unknown pet action', () => {
      const result = parser.parse('pet invalid');
      expect(result).toEqual({
        command: 'pet',
        type: 'error',
        message: 'Unknown pet action: invalid',
        args: ['invalid']
      });
    });
  });
});
