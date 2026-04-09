class LoopedArray<T> {
  private readonly capacity: number;
  private startIndex: number = 0;
  private endIndex: number = 0;
  private count: number = 0;
  readonly data: Array<T | undefined>;

  constructor(init: number | Array<T>) {
    if (typeof init === 'number') {
      this.capacity = init;
      this.data = new Array(init).fill(undefined);
      return;
    }

    const length = init.length;
    this.capacity = length;
    this.data = init;
  }

  private nextFrontPosition(position: number) {
    return (position + 1) % this.capacity;
  }

  private nextBackPosition(position: number) {
    return (position - 1 + this.capacity) % this.capacity;
  }

  get isFull() {
    return this.count === this.capacity;
  }

  get isEmpty() {
    return this.count === 0;
  }

  public push(value: T) {
    if (this.isFull) {
      return false;
    }

    this.data[this.endIndex] = value;
    const nextPosition = this.nextFrontPosition(this.endIndex);
    this.endIndex = nextPosition;
    this.count++;
    return true;
  }

  public pop() {
    if (this.isEmpty) {
      return undefined;
    }

    this.endIndex = this.nextBackPosition(this.endIndex);
    const value = this.data[this.endIndex];
    this.data[this.endIndex] = undefined;
    this.count--;
    return value;
  }

  public unshift(value: T) {
    if (this.isFull) {
      return false;
    }

    const nextPosition = this.nextBackPosition(this.startIndex);
    this.data[nextPosition] = value;
    this.startIndex = nextPosition;
    this.count++;
    return true;
  }

  public shift() {
    if (this.isEmpty) {
      return undefined;
    }

    const value = this.data[this.startIndex];
    this.data[this.startIndex] = undefined;
    this.startIndex = this.nextFrontPosition(this.startIndex);
    this.count--;
    return value;
  }

  toString() {
    return this.data.toString();
  }
}
