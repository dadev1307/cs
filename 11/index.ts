import { deepEqual, throws } from 'node:assert';

type TypedArrayConstructor<T extends ArrayBufferView> = {
  new (buffer: ArrayBuffer, byteOffset: number, length: number): T;
  BYTES_PER_ELEMENT: number;
};

const align = (size: number) => (size + 7) & ~7;

class Pointer {
  private isFreed = false;

  constructor(
    private memory: Memory,
    public readonly offset: number,
    public readonly size: number,
    public readonly allocSize: number,
    private readonly isHeap: boolean,
    private readonly stackDepth: number
  ) {}

  private assertLive(): void {
    if (this.isFreed) throw new Error('Указатель уже освобождён');

    if (!this.isHeap && !this.memory.isStackAllocationLive(this.stackDepth)) {
      throw new Error('Указатель уже освобождён');
    }
  }

  deref<T extends ArrayBufferView>(ViewClass: TypedArrayConstructor<T>): T {
    this.assertLive();

    if (this.offset % ViewClass.BYTES_PER_ELEMENT !== 0) {
      throw new Error('Неверное выравнивание для запрошенного типа массива');
    }

    const length = this.size / ViewClass.BYTES_PER_ELEMENT;

    return new ViewClass(this.memory.buffer, this.offset, length);
  }

  write(data: ArrayBufferView) {
    this.assertLive();

    if (data.byteLength > this.size) {
      throw new Error('Размер данных превышает выделенную память');
    }

    const sourceBytes = new Uint8Array(
      data.buffer,
      data.byteOffset,
      data.byteLength
    );

    new Uint8Array(this.memory.buffer, this.offset, this.size)
      .fill(0)
      .set(sourceBytes);
  }

  free() {
    if (this.isFreed) {
      throw new Error(
        'Обнаружена повторная попытка освобождения (double free)'
      );
    }

    if (!this.isHeap) {
      throw new Error('Нельзя вызвать free() для указателя на стеке');
    }

    this.isFreed = true;
    this.memory.releaseHeapBlock(this.offset, this.allocSize);
  }
}

export class Memory {
  public readonly buffer: ArrayBuffer;

  private readonly stackLimit: number;
  private stackPointer: number = 0;
  private stackAllocations: number[] = [];

  private freeHeapBlocks: { offset: number; size: number }[];

  constructor(totalSize: number, options: { stack: number }) {
    if (options.stack > totalSize * 0.4) {
      throw new Error(
        'Размер стека не должен превышать 40% от всего объема памяти'
      );
    }

    this.buffer = new ArrayBuffer(totalSize);
    this.stackLimit = options.stack;

    this.freeHeapBlocks = [
      { offset: this.stackLimit, size: totalSize - this.stackLimit },
    ];
  }

  push(data: ArrayBufferView): Pointer {
    const size = data.byteLength;
    const alignedSize = align(size);

    if (this.stackPointer + alignedSize > this.stackLimit) {
      throw new Error('Переполнение стека');
    }

    const offset = this.stackPointer;
    this.stackPointer += alignedSize;
    this.stackAllocations.push(offset);
    const stackDepth = this.stackAllocations.length;

    const pointer = new Pointer(
      this,
      offset,
      size,
      alignedSize,
      false,
      stackDepth
    );
    pointer.write(data);
    return pointer;
  }

  pop() {
    const lastAllocation = this.stackAllocations.pop();

    if (!lastAllocation) {
      throw new Error('Недостаточно элементов в стеке (stack underflow)');
    }

    this.stackPointer = lastAllocation;
  }

  isStackAllocationLive(stackDepth: number): boolean {
    return this.stackAllocations.length >= stackDepth;
  }

  alloc(size: number): Pointer {
    const alignedSize = align(size);

    for (let i = 0; i < this.freeHeapBlocks.length; i++) {
      const freeBlock = this.freeHeapBlocks[i];
      if (freeBlock.size >= alignedSize) {
        const offset = freeBlock.offset;

        if (freeBlock.size === alignedSize) {
          this.freeHeapBlocks.splice(i, 1);
        } else {
          freeBlock.offset += alignedSize;
          freeBlock.size -= alignedSize;
        }

        return new Pointer(this, offset, size, alignedSize, true, 0);
      }
    }
    throw new Error('Не хватает памяти в куче');
  }

  releaseHeapBlock(offset: number, size: number): void {
    this.freeHeapBlocks.push({ offset, size });

    this.freeHeapBlocks.sort((a, b) => a.offset - b.offset);

    for (let i = 0; i < this.freeHeapBlocks.length - 1; ) {
      const currentFreeBlock = this.freeHeapBlocks[i];
      const nextFreeBlock = this.freeHeapBlocks[i + 1];

      if (
        currentFreeBlock.offset + currentFreeBlock.size ===
        nextFreeBlock.offset
      ) {
        currentFreeBlock.size += nextFreeBlock.size;
        this.freeHeapBlocks.splice(i + 1, 1);
      } else {
        i++;
      }
    }
  }
}

const memory = new Memory(1024, { stack: 256 });

const pointer1 = memory.push(new Int16Array([-2, 145, 42, 0, -15]));
const pointer2 = memory.push(new Int32Array([-456, 1234]));
const pointer3 = memory.push(new BigInt64Array([10n, -100n]));

deepEqual(pointer1.deref(Int16Array), new Int16Array([-2, 145, 42, 0, -15]));
deepEqual(pointer2.deref(Int32Array), new Int32Array([-456, 1234]));
deepEqual(pointer3.deref(BigInt64Array), new BigInt64Array([10n, -100n]));

pointer2.write(new Int32Array([-7]));
deepEqual(pointer2.deref(Int32Array), new Int32Array([-7, 0]));

memory.pop();
memory.pop();

const pointer4 = memory.push(new Float64Array([100.23, -4532, 1234]));

deepEqual(pointer1.deref(Int16Array), new Int16Array([-2, 145, 42, 0, -15]));
deepEqual(
  pointer4.deref(Float64Array),
  new Float64Array([100.23, -4532, 1234])
);

throws(() => pointer3.deref(BigInt64Array));

const block1 = memory.alloc(4);
block1.write(new Int16Array([-18, 463]));
deepEqual(block1.deref(Int16Array), new Int16Array([-18, 463]));

const block2 = memory.alloc(32);
block2.write(new Float64Array([-18, 463, 2.23]));
deepEqual(block2.deref(Float64Array), new Float64Array([-18, 463, 2.23, 0]));
