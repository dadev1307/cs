export class TrieBuffer {
  private buffer: ArrayBuffer;
  private dataView: DataView;

  private readonly NODES_PER_PAGE = 256;
  private readonly FLAGS_BYTE_SIZE = 1;
  private readonly POINTER_BYTE_SIZE = 3;

  private charByteSize: number;
  private nodeByteSize: number;
  private pageByteSize: number;

  private offsetChar: number;
  private offsetFlags: number;
  private offsetChild: number;
  private offsetSibling: number;

  private MASK_IS_WORD_END = 0b00000001;
  private MASK_HAS_CHILD = 0b00000010;
  private MASK_HAS_SIBLING = 0b00000100;
  private MASK_IS_OCCUPIED = 0b00001000;

  nextFreePosition = 0;

  constructor(charByteSize: 1 | 2 | 3 | 4 = 2, initialPages = 1) {
    this.charByteSize = charByteSize;

    this.nodeByteSize =
      this.charByteSize + this.FLAGS_BYTE_SIZE + this.POINTER_BYTE_SIZE * 2; // Символ + флаги + 2 указателя (дочерний и братский)

    this.pageByteSize = this.NODES_PER_PAGE * this.nodeByteSize;

    this.offsetChar = 0;
    this.offsetFlags = this.charByteSize;
    this.offsetChild = this.charByteSize + this.FLAGS_BYTE_SIZE;
    this.offsetSibling =
      this.charByteSize + this.FLAGS_BYTE_SIZE + this.POINTER_BYTE_SIZE;

    this.buffer = new ArrayBuffer(initialPages * this.pageByteSize);
    this.dataView = new DataView(this.buffer);
  }

  ensureCapacity() {
    const maxNodes = this.buffer.byteLength / this.nodeByteSize;

    if (this.nextFreePosition < maxNodes) {
      return;
    }

    this.buffer = this.buffer.transfer(
      this.buffer.byteLength + this.pageByteSize
    );

    this.dataView = new DataView(this.buffer);
  }

  private getByteOffset(position: number) {
    const pageIndex = Math.floor(position / this.NODES_PER_PAGE);
    const localIndex = position % this.NODES_PER_PAGE;

    return pageIndex * this.pageByteSize + localIndex * this.nodeByteSize;
  }

  private writeCharBytes(offset: number, charCode: number, byteSize: number) {
    if (byteSize === 1) {
      this.dataView.setUint8(offset, charCode & 0xff);
    } else if (byteSize === 2) {
      this.dataView.setUint16(offset, charCode & 0xffff, true);
    } else if (byteSize === 3) {
      this.dataView.setUint16(offset, charCode & 0xffff, true);
      this.dataView.setUint8(offset + 2, (charCode >> 16) & 0xff);
    } else {
      this.dataView.setUint32(offset, charCode, true);
    }
  }

  private readCharBytes(offset: number, byteSize: number) {
    if (byteSize === 1) {
      return this.dataView.getUint8(offset);
    } else if (byteSize === 2) {
      return this.dataView.getUint16(offset, true);
    } else if (byteSize === 3) {
      return (
        this.dataView.getUint16(offset, true) +
        (this.dataView.getUint8(offset + 2) << 16)
      );
    } else {
      return this.dataView.getUint32(offset, true);
    }
  }

  writeChar(position: number, char: string) {
    const charCode = char.codePointAt(0) ?? 0;
    const byteOffset = this.getByteOffset(position);
    this.writeCharBytes(
      byteOffset + this.offsetChar,
      charCode,
      this.charByteSize
    );
  }

  readChar(position: number) {
    const byteOffset = this.getByteOffset(position) + this.offsetChar;
    return this.readCharBytes(byteOffset, this.charByteSize);
  }

  writeFlags(position: number, flags: number) {
    const byteOffset = this.getByteOffset(position) + this.offsetFlags;
    this.dataView.setUint8(byteOffset, flags);
  }

  readFlags(position: number) {
    const byteOffset = this.getByteOffset(position) + this.offsetFlags;
    return this.dataView.getUint8(byteOffset);
  }

  setFlag(position: number, mask: number, isActive: boolean) {
    const flags = this.readFlags(position);
    const newFlags = isActive ? flags | mask : flags & ~mask;

    this.writeFlags(position, newFlags);
  }

  setIsOccupied(position: number, isOccupied: boolean) {
    this.setFlag(position, this.MASK_IS_OCCUPIED, isOccupied);
  }

  isOccupied(position: number) {
    return (this.readFlags(position) & this.MASK_IS_OCCUPIED) !== 0;
  }

  setIsWordEnd(position: number, isWordEnd: boolean) {
    this.setFlag(position, this.MASK_IS_WORD_END, isWordEnd);
  }

  isWordEnd(position: number) {
    return (this.readFlags(position) & this.MASK_IS_WORD_END) !== 0;
  }

  setHasChild(position: number, hasChild: boolean) {
    this.setFlag(position, this.MASK_HAS_CHILD, hasChild);
  }

  hasChild(position: number) {
    return (this.readFlags(position) & this.MASK_HAS_CHILD) !== 0;
  }

  setHasSibling(position: number, hasSibling: boolean) {
    this.setFlag(position, this.MASK_HAS_SIBLING, hasSibling);
  }

  hasSibling(position: number) {
    return (this.readFlags(position) & this.MASK_HAS_SIBLING) !== 0;
  }

  writePointer(position: number, fieldOffset: number, targetPosition: number) {
    const byteOffset = this.getByteOffset(position) + fieldOffset;
    this.dataView.setUint16(byteOffset, targetPosition & 0xffff, true);
    this.dataView.setUint8(byteOffset + 2, (targetPosition >> 16) & 0xff);
  }

  readPointer(position: number, fieldOffset: number) {
    const byteOffset = this.getByteOffset(position) + fieldOffset;
    return (
      this.dataView.getUint16(byteOffset, true) +
      (this.dataView.getUint8(byteOffset + 2) << 16)
    );
  }

  writeChild(position: number, childPosition: number) {
    this.writePointer(position, this.offsetChild, childPosition);
  }

  getChild(position: number) {
    return this.readPointer(position, this.offsetChild);
  }

  writeSibling(position: number, siblingPosition: number) {
    this.writePointer(position, this.offsetSibling, siblingPosition);
  }

  getSibling(position: number) {
    return this.readPointer(position, this.offsetSibling);
  }

  get byteLength() {
    return this.buffer.byteLength;
  }

  get nodeCount() {
    return this.nextFreePosition;
  }

  get bytesPerNode() {
    return this.nodeByteSize;
  }
}

export class CompactTrie {
  private nodes: TrieBuffer;
  private cursorPosition = 0;
  private lastMatchedPosition = -1;

  constructor(charByteSize: 1 | 2 | 3 | 4 = 2, initialPages = 1) {
    this.nodes = new TrieBuffer(charByteSize, initialPages);
  }

  getStats() {
    return {
      byteLength: this.nodes.byteLength,
      nodeCount: this.nodes.nodeCount,
      bytesPerNode: this.nodes.bytesPerNode,
      usedBytes: this.nodes.nodeCount * this.nodes.bytesPerNode,
    };
  }

  resetCursor() {
    this.cursorPosition = 0;
    this.lastMatchedPosition = -1;
    return this;
  }

  private findAmongSiblings(
    char: string,
    startPosition: number
  ): [number, boolean] {
    const charCode = char.codePointAt(0) ?? 0;
    let position = startPosition;

    while (true) {
      const savedCharCode = this.nodes.readChar(position);

      if (savedCharCode === charCode) {
        return [position, true];
      }

      if (!this.nodes.hasSibling(position)) {
        return [position, false];
      }

      position = this.nodes.getSibling(position);
    }
  }

  addWord(word: string) {
    let parentPosition;
    let currentPosition = 0;
    let isMatching = true;

    for (let i = 0; i < word.length; i++) {
      this.nodes.ensureCapacity();
      const char = word[i];

      const isOccupied = this.nodes.isOccupied(currentPosition);

      // Блок выполняется пока находятся совпадения по дочерним и братским элементам
      if (isOccupied && isMatching) {
        const [chainPosition, isFound] = this.findAmongSiblings(
          char,
          currentPosition
        );

        if (!isFound) {
          isMatching = false;
        }

        if (isFound) {
          currentPosition = chainPosition;
        }

        if (isFound && this.nodes.hasChild(chainPosition)) {
          currentPosition = this.nodes.getChild(chainPosition);
          continue;
        }

        if (isOccupied && !isFound) {
          this.nodes.writeSibling(chainPosition, this.nodes.nextFreePosition);
          this.nodes.setHasSibling(chainPosition, true);
        }
      }

      isMatching = false;

      this.nodes.writeChar(this.nodes.nextFreePosition, char);
      this.nodes.setIsOccupied(this.nodes.nextFreePosition, true);

      const isLastChar = i === word.length - 1;

      if (isLastChar) {
        this.nodes.setIsWordEnd(this.nodes.nextFreePosition, true);
      }

      if (parentPosition !== undefined) {
        this.nodes.writeChild(parentPosition, this.nodes.nextFreePosition);
        this.nodes.setHasChild(parentPosition, true);
      }

      parentPosition = this.nodes.nextFreePosition;
      this.nodes.nextFreePosition++;
    }
  }

  go(char: string) {
    if (this.cursorPosition === -1) {
      return this;
    }

    const [chainPosition, isFound] = this.findAmongSiblings(
      char,
      this.cursorPosition
    );

    if (!isFound) {
      this.cursorPosition = -1;
      this.lastMatchedPosition = -1;
      return this;
    }

    this.lastMatchedPosition = chainPosition;

    const hasChild = this.nodes.hasChild(chainPosition);

    this.cursorPosition = hasChild
      ? this.nodes.getChild(chainPosition)
      : chainPosition;

    return this;
  }

  isWord() {
    return (
      this.lastMatchedPosition !== -1 &&
      this.nodes.isWordEnd(this.lastMatchedPosition)
    );
  }

  // Генерация для визуализации дерева
  printTree() {
    if (this.nodes.nextFreePosition === 0) {
      console.log('(пустое дерево)');
      return;
    }

    const lines: string[] = [];

    const walk = (position: number, prefix: string, isLast: boolean) => {
      const char = String.fromCodePoint(this.nodes.readChar(position));
      const wordEndMark = this.nodes.isWordEnd(position) ? ' ●' : '';
      const branch = isLast ? '└── ' : '├── ';

      lines.push(`${prefix}${branch}${char}${wordEndMark}  [${position}]`);

      const childPrefix = prefix + (isLast ? '    ' : '│   ');

      // дети — цепочка sibling'ов первого ребёнка
      if (this.nodes.hasChild(position)) {
        const children: number[] = [];
        let childPosition = this.nodes.getChild(position);

        while (true) {
          children.push(childPosition);
          if (!this.nodes.hasSibling(childPosition)) break;
          childPosition = this.nodes.getSibling(childPosition);
        }

        children.forEach((child, index) => {
          walk(child, childPrefix, index === children.length - 1);
        });
      }
    };

    // корневой уровень — тоже sibling-цепочка от позиции 0
    const roots: number[] = [];
    let rootPosition = 0;

    while (true) {
      roots.push(rootPosition);
      if (!this.nodes.hasSibling(rootPosition)) break;
      rootPosition = this.nodes.getSibling(rootPosition);
    }

    console.log('.');
    roots.forEach((root, index) => {
      walk(root, '', index === roots.length - 1);
    });

    console.log(lines.join('\n'));
  }
}
