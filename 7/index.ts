const writeUint32 = (view: Uint8Array, value: number, offset: number = 0) => {
  view[offset] = (value >> 24) & 0xff;
  view[offset + 1] = (value >> 16) & 0xff;
  view[offset + 2] = (value >> 8) & 0xff;
  view[offset + 3] = value & 0xff;
};

const writeUint16 = (view: Uint8Array, value: number, offset: number = 0) => {
  view[offset] = (value >> 8) & 0xff;
  view[offset + 1] = value & 0xff;
};

export const encodeUtf8 = (str: string): Uint8Array => {
  const encoder = new TextEncoder();
  return encoder.encode(str);
};

export const encodeUtf16 = (str: string): Uint8Array => {
  const result = new Uint8Array(str.length * 2);

  for (let i = 0; i < str.length; i++) {
    writeUint16(result, str.charCodeAt(i), i * 2);
  }

  return result;
};

const readString = (buffer: Uint8Array, length: number, offset: number = 0) => {
  const decoder = new TextDecoder();
  return decoder.decode(buffer.slice(offset, offset + length));
};

const readUint32 = (buffer: Uint8Array, offset: number = 0) => {
  return (
    (buffer[offset] << 24) |
    (buffer[offset + 1] << 16) |
    (buffer[offset + 2] << 8) |
    buffer[offset + 3]
  );
};

const encodePrefixedStrings = (strings: string[]) => {
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  for (const str of strings) {
    const strBytes = encodeUtf8(str);
    const chunk = new Uint8Array(4 + strBytes.length);
    writeUint32(chunk, strBytes.length);
    chunk.set(strBytes, 4);
    chunks.push(chunk);
    totalLength += chunk.length;
  }

  let offset = 4;
  const result = new Uint8Array(offset + totalLength);
  writeUint32(result, strings.length);

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return {
    buffer: result,
    at(targetIndex: number) {
      const count = readUint32(this.buffer);
      const normalized = targetIndex >= 0 ? targetIndex : count + targetIndex;

      if (normalized < 0 || normalized >= count) {
        return undefined;
      }

      let offset = 4;
      for (let i = 0; i < count; i++) {
        const stringLength = readUint32(this.buffer, offset);
        offset += 4;

        if (i === normalized) {
          return readString(this.buffer, stringLength, offset);
        }

        offset += stringLength;
      }
    },
  };
};

const decodePrefixedStrings = (buffer: Uint8Array) => {
  const result: string[] = [];
  let offset = 4;

  while (offset < buffer.length) {
    const stringLength = readUint32(buffer, offset);
    offset += 4;
    result.push(readString(buffer, stringLength, offset));
    offset += stringLength;
  }

  return result;
};

// B

// [<кол-во строк: (+)>, <длина строки N+: (+)>...,<строка N+: (+)... ]

export class IndexedStringBuffer {
  private buffer: Uint8Array = new Uint8Array(0);
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  static COMPACTION_THRESHOLD = 100;
  private wastedBytes = 0;
  private count: number;
  private alwaysRebuild: boolean;

  constructor(strings: string[], alwaysRebuild: boolean = false) {
    this.alwaysRebuild = alwaysRebuild;
    const headerSize = 4 + strings.length * 4;
    let data = new Uint8Array(headerSize);
    let view = new DataView(data.buffer);
    this.count = strings.length;

    view.setUint32(0, strings.length, true);

    let stringOffset = headerSize;

    for (let i = 0; i < strings.length; i++) {
      view.setUint32(4 + i * 4, stringOffset, true);

      const strBytes = this.encoder.encode(strings[i]);
      data = new Uint8Array(
        data.buffer.transfer(data.length + strBytes.byteLength)
      );
      data.set(strBytes, stringOffset);
      view = new DataView(data.buffer);
      stringOffset += strBytes.byteLength;
    }

    this.buffer = data;
  }

  get data() {
    return this.buffer;
  }

  get offsets() {
    return new Uint32Array(this.buffer.buffer, 4, this.count);
  }

  // private compact() {
  //   const offsets = this.offsets;
  //   const compacted = new Uint8Array(this.buffer.length - this.wastedBytes);
  //   const headerSize = 4 + offsets.length * 4;
  //   compacted.set(this.buffer.subarray(0, headerSize));
  //   const view = new DataView(compacted.buffer);

  //   let writeOffset = headerSize;

  //   for (let i = 0; i < offsets.length; i++) {
  //     const bytes = this.getBytesAt(i)!;
  //     let trimmedSize = bytes.byteLength;
  //     while (trimmedSize > 0 && bytes[trimmedSize - 1] === 0) {
  //       trimmedSize--;
  //     }
  //     compacted.set(bytes.subarray(0, trimmedSize), writeOffset);
  //     writeOffset += trimmedSize;

  //     if (i + 1 < offsets.length) {
  //       view.setUint32(4 + (i + 1) * 4, writeOffset, true);
  //     }
  //   }

  //   this.buffer = compacted;
  //   this.wastedBytes = 0;
  // }

  private rebuildWithReplacement(index: number, value: string) {
    const valueBytes = this.encoder.encode(value);

    const slotStart = this.offsets[index];
    const slotEnd = this.offsets[index + 1] ?? this.buffer.byteLength;
    const oldSlotSize = slotEnd - slotStart;
    const byteDelta = valueBytes.byteLength - oldSlotSize;

    const newBuffer = new Uint8Array(this.buffer.byteLength + byteDelta);
    const view = new DataView(newBuffer.buffer);

    newBuffer.set(this.buffer.subarray(0, slotStart));

    newBuffer.set(valueBytes, slotStart);

    newBuffer.set(
      this.buffer.subarray(slotEnd),
      slotStart + valueBytes.byteLength
    );

    for (let i = index + 1; i < this.count; i++) {
      const oldOffset = view.getUint32(4 + i * 4, true);
      view.setUint32(4 + i * 4, oldOffset + byteDelta, true);
    }

    this.buffer = newBuffer;
  }

  private normalizeIndex(index: number): number | undefined {
    const normalized = index >= 0 ? index : this.offsets.length + index;

    if (normalized < 0 || normalized >= this.offsets.length) {
      return undefined;
    }

    return normalized;
  }

  private getBytesAt(index: number): Uint8Array | undefined {
    const normalized = this.normalizeIndex(index);

    if (normalized === undefined) {
      return undefined;
    }

    const start = this.offsets[normalized];
    const end = this.offsets[normalized + 1] ?? this.buffer.byteLength;

    return this.buffer.subarray(start, end);
  }

  at(index: number): string | undefined {
    const bytes = this.getBytesAt(index);

    if (!bytes) {
      return undefined;
    }

    return this.decoder.decode(bytes);
  }

  set(index: number, value: string): boolean {
    const normalized = this.normalizeIndex(index);

    if (normalized === undefined) {
      return false;
    }

    const valueBytes = this.encoder.encode(value);
    const targetBytes = this.getBytesAt(normalized);

    if (!targetBytes) {
      return false;
    }

    if (valueBytes.byteLength === targetBytes.byteLength) {
      targetBytes.set(valueBytes, 0);
      return true;
    }

    // if (!this.alwaysRebuild && valueBytes.byteLength < targetBytes.byteLength) {
    //   this.wastedBytes += targetBytes.byteLength - valueBytes.byteLength;
    //   targetBytes.fill(0);
    //   targetBytes.set(valueBytes, 0);

    //   if (this.wastedBytes > IndexedStringBuffer.COMPACTION_THRESHOLD) {
    //     this.compact();
    //   }

    //   return true;
    // }

    this.rebuildWithReplacement(normalized, value);
    return true;
  }
}

class StringBufferReader {
  private decoder = new TextDecoder();
  private strings: string[] = [];

  constructor(data: Uint8Array) {
    const view = new DataView(data.buffer);
    const count = view.getUint32(0, true);
    const offsets = new Uint32Array(data.buffer, 4, count);

    for (let i = 0; i < offsets.length; i++) {
      const start = offsets[i];
      const end = offsets[i + 1] ?? data.byteLength;
      this.strings.push(this.decoder.decode(data.subarray(start, end)));
    }
  }
}

const test = new IndexedStringBuffer(['hello', 'world']);
test.set(0, '5!');
console.log(test.data);
console.log(test.at(0));
console.log(test.at(-1));
