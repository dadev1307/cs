interface ViewConstructor<TView> {
  new (length: number): TView;
}

interface MutableArrayLike<T> {
  length: number;
  [n: number]: T;
}

class Block<TView extends MutableArrayLike<any>> {
  data: TView;
  count: number = 0;
  next: Block<TView> | null = null;
  prev: Block<TView> | null = null;

  constructor(View: ViewConstructor<TView>, blockSize: number) {
    this.data = new View(blockSize);
  }
}

export class BlockDeque<TView extends MutableArrayLike<any>> {
  ViewArray: ViewConstructor<TView>;
  blockSize: number;
  headBlock: Block<TView>;
  tailBlock: Block<TView>;
  count: number = 0;
  prevPointer: number = 0;
  nextPointer: number = 0;

  constructor(View: ViewConstructor<TView>, blockSize = 64) {
    this.ViewArray = View;
    this.blockSize = blockSize;

    const initialBlock = new Block<TView>(View, blockSize);
    this.headBlock = initialBlock;
    this.tailBlock = initialBlock;
  }

  push(value: TView[number]) {
    if (this.nextPointer === this.blockSize) {
      const newBlock = new Block<TView>(this.ViewArray, this.blockSize);
      newBlock.prev = this.tailBlock;
      this.tailBlock!.next = newBlock;
      this.tailBlock = newBlock;
      this.nextPointer = 0;
    }

    this.tailBlock!.data[this.nextPointer] = value;
    this.nextPointer++;
    this.tailBlock!.count++;
    this.count++;

    return this.count;
  }

  pop() {
    if (this.count === 0) {
      return undefined;
    }

    if (!this.tailBlock) {
      throw new Error('BlockDeque is empty');
    }

    this.nextPointer--;
    const value = this.tailBlock.data[this.nextPointer];
    this.tailBlock.count--;
    this.count--;

    if (this.tailBlock.count === 0 && this.tailBlock.prev !== null) {
      this.tailBlock = this.tailBlock.prev;
      this.tailBlock.next = null;
      this.nextPointer = this.blockSize;
    }

    return value;
  }

  unshift(value: TView[number]) {
    if (this.prevPointer === 0) {
      const newBlock = new Block<TView>(this.ViewArray, this.blockSize);
      newBlock.next = this.headBlock;
      this.headBlock.prev = newBlock;
      this.headBlock = newBlock;
      this.prevPointer = this.blockSize;
    }

    this.prevPointer--;
    this.headBlock.data[this.prevPointer] = value;

    this.headBlock.count++;
    this.count++;

    return this.count;
  }

  shift() {
    if (this.count === 0) {
      return undefined;
    }

    if (!this.headBlock) {
      throw new Error('BlockDeque is empty');
    }

    const value = this.headBlock.data[this.prevPointer];
    this.prevPointer++;
    this.headBlock.count--;
    this.count--;

    if (this.headBlock.count === 0 && this.headBlock.next !== null) {
      this.headBlock = this.headBlock.next;
      this.headBlock.prev = null;
      this.prevPointer = 0;
    }

    return value;
  }
}

export class DequeRealloc<TView extends MutableArrayLike<any>> {
  ViewArray: ViewConstructor<TView>;
  initialCapacity: number;
  capacity: number;
  data: TView;
  head: number = 0;
  tail: number = 0;
  count: number = 0;

  constructor(View: ViewConstructor<TView>, initialCapacity = 64) {
    this.ViewArray = View;
    this.initialCapacity = initialCapacity;
    this.capacity = initialCapacity;
    this.data = new View(initialCapacity);
  }

  private resize(newCapacity: number) {
    const newData = new this.ViewArray(newCapacity);

    for (let i = 0; i < this.count; i++) {
      newData[i] = this.data[(this.head + i) % this.capacity];
    }

    this.data = newData;
    this.capacity = newCapacity;
    this.head = 0;
    this.tail = this.count;
  }

  push(value: TView[number]) {
    if (this.count === this.capacity) {
      this.resize(this.capacity * 2);
    }

    this.data[this.tail] = value;
    this.tail = (this.tail + 1) % this.capacity;
    this.count++;

    return this.count;
  }

  pop() {
    if (this.count === 0) return undefined;

    this.tail = (this.tail - 1 + this.capacity) % this.capacity;
    const value = this.data[this.tail];
    this.count--;

    // Сужение: если заполнено <= 25% и мы больше стартового размера
    if (
      this.capacity > this.initialCapacity &&
      this.count <= Math.floor(this.capacity / 4)
    ) {
      this.resize(Math.floor(this.capacity / 2));
    }

    return value;
  }

  unshift(value: TView[number]) {
    if (this.count === this.capacity) {
      this.resize(this.capacity * 2);
    }

    this.head = (this.head - 1 + this.capacity) % this.capacity;
    this.data[this.head] = value;
    this.count++;

    return this.count;
  }

  shift() {
    if (this.count === 0) return undefined;

    const value = this.data[this.head];
    this.head = (this.head + 1) % this.capacity;
    this.count--;

    // Сужение: если заполнено <= 25% и мы больше стартового размера
    if (
      this.capacity > this.initialCapacity &&
      this.count <= Math.floor(this.capacity / 4)
    ) {
      this.resize(Math.floor(this.capacity / 2));
    }

    return value;
  }
}
