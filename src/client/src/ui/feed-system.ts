export interface FeedEntry {
  at: number;
  text: string;
  type: 'info' | 'combat' | 'loot' | 'quest' | 'error';
}

export class FeedSystem {
  private container: HTMLElement;
  private maxLines: number = 200;

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.className = 'feed-container';
  }

  addEntry(entry: FeedEntry): void {
    const entryElement = this.createEntryElement(entry);
    this.container.appendChild(entryElement);
    
    this.enforceMaxLines();
    this.scrollToBottom();
  }

  addEntries(entries: FeedEntry[]): void {
    entries.forEach(entry => {
      const entryElement = this.createEntryElement(entry);
      this.container.appendChild(entryElement);
    });
    
    this.enforceMaxLines();
    this.scrollToBottom();
  }

  clear(): void {
    this.container.innerHTML = '';
  }

  setMaxLines(maxLines: number): void {
    this.maxLines = maxLines;
    this.enforceMaxLines();
  }

  private createEntryElement(entry: FeedEntry): HTMLElement {
    const element = document.createElement('div');
    element.className = 'feed-entry';
    
    const timestamp = new Date(entry.at).toLocaleTimeString();
    const typeLabel = `[${entry.type}]`;
    
    element.innerHTML = `
      <span class="feed-timestamp">${timestamp}</span>
      <span class="feed-type">${typeLabel}</span>
      <span class="feed-text">${entry.text}</span>
    `;
    
    return element;
  }

  private enforceMaxLines(): void {
    const entries = this.container.querySelectorAll('.feed-entry');
    
    while (entries.length > this.maxLines) {
      const firstEntry = entries[0];
      if (firstEntry && firstEntry.parentNode) {
        firstEntry.parentNode.removeChild(firstEntry);
      }
    }
  }

  private scrollToBottom(): void {
    this.container.scrollTop = this.container.scrollHeight;
  }
}
