// Решение учителя для сравнения

interface TrieNode {
  char: string;
  word: boolean;
  children: Map<string, number>;
}

export class Trie {
  #buffer: TrieNode[] = [{ char: '', word: false, children: new Map() }];

  addWord(word: string) {
    let cursor = 0;

    for (const char of word) {
      const current = this.#buffer[cursor];

      if (current.children.has(char)) {
        cursor = current.children.get(char)!;
      } else {
        const trieNode = { char, word: false, children: new Map() };
        const pointer = this.#buffer.push(trieNode) - 1;
        current.children.set(char, pointer);
        cursor = pointer;
      }
    }

    this.#buffer[cursor].word = true;
  }

  go(char: string): TrieView {
    return new TrieView(0, this.#buffer).go(char);
  }

  getStats() {
    const nodeCount = this.#buffer.length;
    let mapEntries = 0;

    for (const node of this.#buffer) {
      mapEntries += node.children.size;
    }

    return { nodeCount, mapEntries };
  }
}

export class TrieView {
  readonly #start: number;
  readonly #buffer: TrieNode[];

  constructor(start: number, buffer: TrieNode[]) {
    this.#start = start;
    this.#buffer = buffer;
  }

  go(char: string) {
    const s = this.#start;
    const buf = this.#buffer;
    return s === -1 || buf[s] == null
      ? this
      : new TrieView(buf[s].children.get(char) ?? -1, buf);
  }

  isWord(): boolean {
    const s = this.#start;
    const buf = this.#buffer;
    return s === -1 || buf[s] == null ? false : buf[s].word;
  }
}
