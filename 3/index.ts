class BCD {
  private buffer: Uint8Array;
  private length: number = 0;

  constructor(num: number | bigint) {
    this.buffer = this.convertToUnit8Array(num);
  }

  private packBCD(digit1: number, digit2: number): number {
    return (digit1 << 4) | digit2;
  }

  private unpackBCD(byte: number): [number, number] {
    return [byte >> 4, byte & 0x0f];
  }

  private *generateReverseDigits(num: number | bigint): Generator<number> {
    if (typeof num === 'bigint') {
      while (num > 0n) {
        yield Number(num % 10n);
        num = num / 10n;
      }
    } else {
      while (num > 0) {
        yield num % 10;
        num = Math.floor(num / 10);
      }
    }
  }

  private convertToUnit8Array(
    num: number | bigint,
    initCapacity: number = 1
  ): Uint8Array {
    let capacity = initCapacity;
    let buffer = new Uint8Array(capacity);
    let len = capacity - 1;

    const generator = this.generateReverseDigits(num);
    let isDone = false;

    while (!isDone) {
      const rightDigit = generator.next();
      const leftDigit = generator.next();

      if (rightDigit.done) {
        isDone = true;
        break;
      }

      if (len < 0) {
        len = capacity - 1;
        capacity = capacity * 2;
        const newBuffer = new Uint8Array(capacity);
        newBuffer.set(buffer, len + 1);
        buffer = newBuffer;
      }

      if (leftDigit.done) {
        isDone = true;
        buffer[len] = this.packBCD(0, rightDigit.value);
        len--;
        this.length = this.length + 1;
        break;
      }

      buffer[len] = this.packBCD(leftDigit.value, rightDigit.value);
      len--;
      this.length = this.length + 2;
    }

    return buffer.subarray(len + 1);
  }

  toBigint(): bigint {
    let result = 0n;

    for (let i = 0; i < this.buffer.length; i++) {
      const [first, second] = this.unpackBCD(this.buffer[i]);
      result = result * 100n + BigInt(first * 10 + second);
    }

    return result;
  }

  toNumber(): number {
    let result = 0;

    for (let i = 0; i < this.buffer.length; i++) {
      const [first, second] = this.unpackBCD(this.buffer[i]);
      result = result * 100 + first * 10 + second;
    }

    return result;
  }

  at(index: number): number {
    if (index < 0) {
      index = this.length + index;
    }

    const shiftedIndex = index + (this.length % 2);

    const byteIndex = Math.floor(shiftedIndex / 2);
    const byte = this.buffer[byteIndex];

    if (byte === undefined) {
      return 0;
    }

    const [first, second] = this.unpackBCD(byte);

    return shiftedIndex % 2 === 0 ? first : second;
  }
}
