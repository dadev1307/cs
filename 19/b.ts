class TrieNode {
  isWordEnd: boolean = false;

  fullWord: string = '';

  public children: Map<string, number> = new Map();
}

class Trie {
  private nodes: TrieNode[] = [new TrieNode()];

  private delimiter: string;

  constructor(delimiter: string = '.') {
    this.delimiter = delimiter;
  }

  addWord(word: string) {
    const segments = word.split(this.delimiter);

    let nodeIndex = 0;

    for (const segment of segments) {
      let currentNode = this.nodes[nodeIndex];

      if (currentNode.children.has(segment)) {
        nodeIndex = currentNode.children.get(segment)!;
      } else {
        const newNode = new TrieNode();

        const newNodeIndex = this.nodes.push(newNode) - 1;

        currentNode.children.set(segment, newNodeIndex);

        nodeIndex = newNodeIndex;
      }
    }

    this.nodes[nodeIndex].isWordEnd = true;

    this.nodes[nodeIndex].fullWord = word;
  }

  match(pattern: string, words: string[]): string[] {
    words.forEach((word) => this.addWord(word));

    const patternSegments = pattern.split(this.delimiter);

    const matchedWords: string[] = [];

    this.searchMatches(0, 0, patternSegments, matchedWords);

    return matchedWords;
  }

  private collectAllWords(nodeIndex: number, matchedWords: string[]) {
    const currentNode = this.nodes[nodeIndex];

    if (currentNode.isWordEnd) {
      matchedWords.push(currentNode.fullWord);
    }

    for (const childNodeIndex of currentNode.children.values()) {
      this.collectAllWords(childNodeIndex, matchedWords);
    }
  }

  private searchMatches(
    nodeIndex: number,

    segmentIndex: number,

    patternSegments: string[],

    matchedWords: string[]
  ) {
    const currentNode = this.nodes[nodeIndex];

    const hasConsumedAllSegments = segmentIndex === patternSegments.length;

    if (hasConsumedAllSegments && currentNode.isWordEnd) {
      matchedWords.push(currentNode.fullWord);

      return;
    }

    const segment = patternSegments[segmentIndex];

    if (segment === '**') {
      this.collectAllWords(nodeIndex, matchedWords);

      return;
    }

    if (segment === '*') {
      for (const childNodeIndex of currentNode.children.values()) {
        this.searchMatches(
          childNodeIndex,
          segmentIndex + 1,
          patternSegments,
          matchedWords
        );
      }

      return;
    }

    if (currentNode.children.has(segment)) {
      const nextNodeIndex = currentNode.children.get(segment)!;

      this.searchMatches(
        nextNodeIndex,
        segmentIndex + 1,
        patternSegments,
        matchedWords
      );
    }
  }
}

const trie = new Trie();

console.log(
  trie.match('foo.*.bar.**', ['foo', 'foo.bla.bar.baz', 'foo.bag.bar.ban.bla'])
);
