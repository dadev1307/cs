class RingArray<T> {
  private readonly capacity: number;
  private readonly data: Array<T | undefined>;
  private count: number = 0;
  private forwardIndex: number = 0;
  private backwardIndex: number = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.data = new Array(capacity).fill(undefined);
  }

  get isEmpty() {
    return this.count === 0;
  }

  get isFull() {
    return this.count === this.capacity;
  }

  private stepForward(position: number) {
    return (position + 1) % this.capacity;
  }

  private stepBackward(position: number) {
    return (position - 1 + this.capacity) % this.capacity;
  }

  public push(value: T) {
    if (this.isFull) {
      return false;
    }

    this.data[this.forwardIndex] = value;
    const nextPosition = this.stepForward(this.forwardIndex);
    this.forwardIndex = nextPosition;
    this.count++;
    return true;
  }

  public pop() {
    if (this.isEmpty) {
      return undefined;
    }

    this.backwardIndex = this.stepBackward(this.backwardIndex);
    const value = this.data[this.backwardIndex];
    this.data[this.backwardIndex] = undefined;
    this.count--;
    return value;
  }

  public unshift(value: T) {
    if (this.isFull) {
      return false;
    }

    const nextPosition = this.stepBackward(this.backwardIndex);
    this.data[nextPosition] = value;
    this.backwardIndex = nextPosition;
    this.count++;
    return true;
  }

  public shift() {
    if (this.isEmpty) {
      return undefined;
    }

    const value = this.data[this.forwardIndex];
    this.data[this.forwardIndex] = undefined;
    this.forwardIndex = this.stepForward(this.forwardIndex);
    this.count--;
    return value;
  }

  get state() {
    return {
      capacity: this.capacity,
      data: this.data.slice(),
      count: this.count,
      forwardIndex: this.forwardIndex,
      backwardIndex: this.backwardIndex,
      isEmpty: this.isEmpty,
      isFull: this.isFull,
    };
  }
}
