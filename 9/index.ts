import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';
import * as util from 'node:util';
import { createCanvas, loadImage } from 'canvas';

export type TupleRGBA = [number, number, number, number];

interface View<TValue = unknown, TResult = unknown, TInner = unknown> {
  readonly BYTES: number;
  view(): TInner;
  get(): TResult;
  set(value: TValue): void;
  setOffset(byteOffset: number): void;
}

interface ViewCtor<TValue, TResult, TInner> {
  readonly BYTES: number;
  new (buffer: Uint8Array, byteOffset?: number): View<TValue, TResult, TInner>;
  calcBytesLength(value: TValue): number;
}

export class RGBAView {
  static readonly BYTES = 4;

  private buffer: Uint8ClampedArray;
  private byteOffset: number = 0;

  constructor(buffer: Uint8Array, byteOffset: number = 0) {
    this.buffer = new Uint8ClampedArray(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength
    );
    this.byteOffset = byteOffset;
  }

  setOffset(byteOffset: number) {
    if (byteOffset < 0 || byteOffset + RGBAView.BYTES > this.buffer.length) {
      throw new Error('Попытка установить offset за пределами буфера');
    }

    this.byteOffset = byteOffset;
  }

  get red(): number {
    return this.buffer[this.byteOffset];
  }
  set red(value: number) {
    this.buffer[this.byteOffset] = value;
  }

  get green(): number {
    return this.buffer[this.byteOffset + 1];
  }
  set green(value: number) {
    this.buffer[this.byteOffset + 1] = value;
  }

  get blue(): number {
    return this.buffer[this.byteOffset + 2];
  }
  set blue(value: number) {
    this.buffer[this.byteOffset + 2] = value;
  }

  get alpha(): number {
    return this.buffer[this.byteOffset + 3];
  }
  set alpha(value: number) {
    this.buffer[this.byteOffset + 3] = value;
  }
}

export class RGBA implements View<TupleRGBA | string, TupleRGBA, RGBAView> {
  static readonly BYTES = RGBAView.BYTES;
  readonly BYTES = RGBAView.BYTES;
  private bytes: RGBAView;

  constructor(buffer: Uint8Array, byteOffset: number = 0) {
    this.bytes = new RGBAView(buffer, byteOffset);
  }

  static calcBytesLength(value: string | TupleRGBA): number {
    return RGBA.BYTES;
  }

  private parseHex(hex: string): TupleRGBA {
    if (!hex.startsWith('#')) {
      throw new Error('Hex обязан начинаться с #');
    }

    let digits = hex.slice(1);
    const digitsLength = digits.length;

    if (
      digitsLength !== 3 &&
      digitsLength !== 4 &&
      digitsLength !== 6 &&
      digitsLength !== 8
    ) {
      throw new Error(
        'Hex должен быть в формате #RGB, #RGBA, #RRGGBB или #RRGGBBAA'
      );
    }

    if (digitsLength === 3 || digitsLength === 4) {
      digits = digits
        .split('')
        .map((char) => char + char)
        .join('');
    }

    const red = parseInt(digits.slice(0, 2), 16);
    const green = parseInt(digits.slice(2, 4), 16);
    const blue = parseInt(digits.slice(4, 6), 16);
    const alpha = digitsLength === 8 ? parseInt(digits.slice(6, 8), 16) : 255;

    if (
      Number.isNaN(red) ||
      Number.isNaN(green) ||
      Number.isNaN(blue) ||
      Number.isNaN(alpha)
    ) {
      throw new Error('Hex не может быть преобразован в RGBA');
    }

    return [red, green, blue, alpha];
  }

  set(value: string | TupleRGBA) {
    if (typeof value === 'string') {
      const [red, green, blue, alpha] = this.parseHex(value);
      this.bytes.red = red;
      this.bytes.green = green;
      this.bytes.blue = blue;
      this.bytes.alpha = alpha;
    } else {
      this.bytes.red = value[0];
      this.bytes.green = value[1];
      this.bytes.blue = value[2];
      this.bytes.alpha = value[3];
    }
  }

  get(): TupleRGBA {
    return [
      this.bytes.red,
      this.bytes.green,
      this.bytes.blue,
      this.bytes.alpha,
    ];
  }

  view(): RGBAView {
    return this.bytes;
  }

  setOffset(byteOffset: number) {
    this.bytes.setOffset(byteOffset);
  }
}

export class Matrix2D<TValue, TResult, TInner> {
  private buffer: Uint8Array;
  private width: number;
  private height: number;
  private cursor: View<TValue, TResult, TInner>;

  constructor(
    width: number,
    height: number,
    viewCtor: ViewCtor<TValue, TResult, TInner>,
    buffer?: Uint8Array
  ) {
    this.width = width;
    this.height = height;

    this.buffer = buffer ?? new Uint8Array(width * height * viewCtor.BYTES);
    this.cursor = new viewCtor(this.buffer);
  }

  set(x: number, y: number, value: TValue) {
    const byteOffset = (y * this.width + x) * this.cursor.BYTES;
    this.cursor.setOffset(byteOffset);
    this.cursor.set(value);
  }

  get(x: number, y: number): TResult {
    const byteOffset = (y * this.width + x) * this.cursor.BYTES;
    this.cursor.setOffset(byteOffset);
    return this.cursor.get();
  }

  fill(value: TValue) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.set(x, y, value);
      }
    }
  }

  view(x: number, y: number): TInner {
    const byteOffset = (y * this.width + x) * this.cursor.BYTES;
    this.cursor.setOffset(byteOffset);
    return this.cursor.view();
  }

  get bytes(): Uint8Array {
    return this.buffer;
  }
}

////////////// Task 2 //////////////

export class Vector<TValue, TResult, TInner> {
  static HEADER_BYTES = 8;
  static ENTRY_BYTES = 8;
  static DEFAULT_HEAP_SIZE = 1024;

  private buffer: Uint8Array;
  private dataView: DataView;
  private viewCtor: ViewCtor<TValue, TResult, TInner>;
  private heapTop: number;
  private cursor: View<TValue, TResult, TInner>;

  constructor(
    capacity: number,
    viewCtor: ViewCtor<TValue, TResult, TInner>,
    buffer?: Uint8Array
  ) {
    if (buffer) {
      this.buffer = buffer;
      this.dataView = new DataView(buffer.buffer);
    } else {
      this.buffer = new Uint8Array(
        Vector.HEADER_BYTES +
          Vector.ENTRY_BYTES * capacity +
          Vector.DEFAULT_HEAP_SIZE
      );
      this.dataView = new DataView(this.buffer.buffer);
      this.capacity = capacity;
      this.length = 0;
    }

    this.viewCtor = viewCtor;
    this.cursor = new viewCtor(this.buffer);
    this.heapTop = this.buffer.byteLength;
  }

  reallocHeap(minSize: number = 0) {
    const oldHeapSize = this.heap.byteLength;
    let newHeapSize = oldHeapSize;

    do {
      newHeapSize = newHeapSize * 2;
    } while (newHeapSize - oldHeapSize < minSize);

    const delta = newHeapSize - oldHeapSize;

    const newBuffer = new Uint8Array(this.buffer.byteLength + delta);

    newBuffer.set(this.metadata);
    newBuffer.set(this.heap, newBuffer.byteLength - this.heap.byteLength);

    this.buffer = newBuffer;
    this.dataView = new DataView(this.buffer.buffer);
    this.heapTop = this.heapTop + delta;

    this.cursor = new this.viewCtor(this.buffer);

    for (let i = 0; i < this.length; i++) {
      const entryOffset = Vector.HEADER_BYTES + Vector.ENTRY_BYTES * i;
      const oldPosition = this.dataView.getUint32(entryOffset, true);
      this.dataView.setUint32(entryOffset, oldPosition + delta, true);
    }
  }

  reallocCapacity(capacity?: number) {
    const newCapacity = capacity ?? this.capacity * 2;
    const fit =
      this.buffer.byteLength -
      Vector.HEADER_BYTES -
      Vector.ENTRY_BYTES * newCapacity -
      (this.heap.byteLength - (this.buffer.byteLength - this.heapTop));

    if (fit < 0) {
      this.reallocHeap(Math.abs(fit));
    } else {
      this.cursor = new this.viewCtor(this.buffer);
    }

    this.capacity = newCapacity;
  }

  set(index: number, value: TValue) {
    if (index < 0 || this.capacity - index < 0) {
      throw new Error('Index выходит за пределы вектора');
    }

    if (this.capacity - index == 0) {
      this.reallocCapacity();
    }

    const byteLength = this.viewCtor.calcBytesLength(value);

    let entriesEnd = this.metadata.byteLength;
    let valueOffset = this.heapTop - byteLength;

    if (valueOffset < entriesEnd) {
      do {
        this.reallocHeap(entriesEnd - valueOffset);

        entriesEnd = this.metadata.byteLength;
        valueOffset = this.heapTop - byteLength;
      } while (valueOffset < entriesEnd);
    }

    this.cursor.setOffset(valueOffset);
    this.cursor.set(value);
    this.heapTop = valueOffset;

    this.dataView.setUint32(
      Vector.HEADER_BYTES + Vector.ENTRY_BYTES * index,
      valueOffset,
      true
    );
    this.dataView.setUint32(
      Vector.HEADER_BYTES + Vector.ENTRY_BYTES * index + 4,
      byteLength,
      true
    );

    if (index >= this.length) {
      this.length = index + 1;
    }
  }

  get(index: number): TResult {
    if (index < 0 || index >= this.length) {
      throw new Error('Index выходит за пределы вектора');
    }

    const valueOffset = this.dataView.getUint32(
      Vector.HEADER_BYTES + Vector.ENTRY_BYTES * index,
      true
    );

    this.cursor.setOffset(valueOffset);
    return this.cursor.get();
  }

  fill(value: TValue) {
    for (let i = 0; i < this.capacity; i++) {
      this.set(i, value);
    }
  }

  push(value: TValue) {
    this.set(this.length, value);
  }

  pop(): TResult | undefined {
    if (this.length === 0) {
      return undefined;
    }

    const lastIndex = this.length - 1;
    const value = this.get(lastIndex);

    const valueOffset = this.dataView.getUint32(
      Vector.HEADER_BYTES + Vector.ENTRY_BYTES * lastIndex,
      true
    );
    const byteLength = this.dataView.getUint32(
      Vector.HEADER_BYTES + Vector.ENTRY_BYTES * lastIndex + 4,
      true
    );

    if (valueOffset === this.heapTop) {
      this.heapTop = valueOffset + byteLength;
    }

    this.dataView.setUint32(
      Vector.HEADER_BYTES + Vector.ENTRY_BYTES * lastIndex,
      0,
      true
    );
    this.dataView.setUint32(
      Vector.HEADER_BYTES + Vector.ENTRY_BYTES * lastIndex + 4,
      0,
      true
    );

    this.length = lastIndex;
    return value;
  }

  view(index: number): TInner {
    if (index < 0 || index >= this.length) {
      throw new Error('Index выходит за пределы вектора');
    }

    const valueOffset = this.dataView.getUint32(
      Vector.HEADER_BYTES + Vector.ENTRY_BYTES * index,
      true
    );

    this.cursor.setOffset(valueOffset);
    return this.cursor.view();
  }

  reserve(additional: number) {
    if (additional <= 0) {
      return;
    }

    const required = this.length + additional;

    if (required > this.capacity) {
      this.reallocCapacity(required);
    }
  }

  shrinkToFit() {
    const usedHeapSize = this.buffer.byteLength - this.heapTop;
    const newSize =
      Vector.HEADER_BYTES + Vector.ENTRY_BYTES * this.length + usedHeapSize;

    if (newSize >= this.buffer.byteLength) {
      return;
    }

    const delta = newSize - this.buffer.byteLength;
    const newBuffer = new Uint8Array(newSize);

    newBuffer.set(this.buffer.subarray(0, Vector.HEADER_BYTES), 0);

    if (this.length > 0) {
      newBuffer.set(
        this.buffer.subarray(
          Vector.HEADER_BYTES,
          Vector.HEADER_BYTES + Vector.ENTRY_BYTES * this.length
        ),
        Vector.HEADER_BYTES
      );
    }

    if (usedHeapSize > 0) {
      newBuffer.set(this.buffer.subarray(this.heapTop), newSize - usedHeapSize);
    }

    this.buffer = newBuffer;
    this.dataView = new DataView(this.buffer.buffer);
    this.heapTop = this.heapTop + delta;
    this.cursor = new this.viewCtor(this.buffer);
    this.capacity = this.length;

    for (let i = 0; i < this.length; i++) {
      const entryOffset = Vector.HEADER_BYTES + Vector.ENTRY_BYTES * i;
      const oldPosition = this.dataView.getUint32(entryOffset, true);
      this.dataView.setUint32(entryOffset, oldPosition + delta, true);
    }
  }

  get bytes(): Uint8Array {
    return this.buffer;
  }

  get metadata() {
    return this.buffer.subarray(
      0,
      Vector.HEADER_BYTES + Vector.ENTRY_BYTES * this.capacity
    );
  }

  get entries() {
    return this.buffer.subarray(
      Vector.HEADER_BYTES,
      Vector.HEADER_BYTES + Vector.ENTRY_BYTES * this.capacity
    );
  }

  get heap() {
    return this.buffer.subarray(
      Vector.HEADER_BYTES + Vector.ENTRY_BYTES * this.capacity
    );
  }

  get capacity() {
    return this.dataView.getUint32(0, true);
  }

  private set capacity(value: number) {
    this.dataView.setUint32(0, value, true);
  }

  get length() {
    return this.dataView.getUint32(4, true);
  }

  private set length(value: number) {
    this.dataView.setUint32(4, value, true);
  }
}
