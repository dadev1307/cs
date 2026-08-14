export class Writer<T> {
  constructor(
    private value: T,
    private logs: Array<string> = []
  ) {}

  static of<U>(value: U): Writer<U> {
    return new Writer(value);
  }

  tell(message: string) {
    return new Writer(this.value, [...this.logs, message]);
  }

  map<U>(fn: (value: T) => U): Writer<U> {
    return new Writer(fn(this.value), [...this.logs]);
  }

  flatMap<U>(fn: (value: T) => Writer<U>): Writer<U> {
    const nextWriter = fn(this.value);

    return new Writer(nextWriter.value, [...this.logs, ...nextWriter.logs]);
  }

  run(): { value: T; log: Array<string> } {
    return { value: this.value, log: this.logs };
  }
}
