import { describe, it, expect, beforeEach } from 'vitest';
import { FeedSystem } from '../src/ui/feed-system';

describe('FeedSystem', () => {
  let feedSystem: FeedSystem;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    feedSystem = new FeedSystem(container);
  });

  it('should add feed entries to the container', () => {
    feedSystem.addEntry({
      at: Date.now(),
      text: 'Welcome to Hub!',
      type: 'info'
    });

    const entries = container.querySelectorAll('.feed-entry');
    expect(entries).toHaveLength(1);
    expect(entries[0].textContent).toContain('Welcome to Hub!');
  });

  it('should format entries with timestamp and type', () => {
    const timestamp = 1700000000000;
    feedSystem.addEntry({
      at: timestamp,
      text: 'You attack the boarling for 15 damage',
      type: 'combat'
    });

    const entry = container.querySelector('.feed-entry');
    expect(entry?.textContent).toContain('[combat]');
    expect(entry?.textContent).toContain('You attack the boarling for 15 damage');
  });

  it('should limit feed entries to maxLines', () => {
    feedSystem.setMaxLines(3);

    // Add 5 entries
    for (let i = 0; i < 5; i++) {
      feedSystem.addEntry({
        at: Date.now(),
        text: `Entry ${i}`,
        type: 'info'
      });
    }

    const entries = container.querySelectorAll('.feed-entry');
    expect(entries).toHaveLength(3);
    expect(entries[0].textContent).toContain('Entry 2'); // Oldest should be removed
    expect(entries[2].textContent).toContain('Entry 4'); // Newest should remain
  });

  it('should clear all entries', () => {
    feedSystem.addEntry({
      at: Date.now(),
      text: 'Test entry',
      type: 'info'
    });

    feedSystem.clear();

    const entries = container.querySelectorAll('.feed-entry');
    expect(entries).toHaveLength(0);
  });

  it('should add multiple entries at once', () => {
    const entries = [
      { at: Date.now(), text: 'Entry 1', type: 'info' as const },
      { at: Date.now(), text: 'Entry 2', type: 'combat' as const }
    ];

    feedSystem.addEntries(entries);

    const feedEntries = container.querySelectorAll('.feed-entry');
    expect(feedEntries).toHaveLength(2);
  });
});
