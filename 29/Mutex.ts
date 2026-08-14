function once(callback: Function) {
  let hasBeenCalled = false;
  return function (this: unknown, ...args: any[]) {
    if (hasBeenCalled) {
      return;
    }
    hasBeenCalled = true;
    callback.apply(this, args);
  };
}

export class Semaphore<T> {
  private waitingResolvers: Array<any> = [];
  private activeCount = 0;
  constructor(
    private resource: T,
    private maxConcurrent: number
  ) {}

  createFree() {
    return once(() => {
      const nextResolver = this.waitingResolvers.shift();

      if (!nextResolver) {
        this.activeCount = Math.min(this.activeCount + 1, this.maxConcurrent);
        return;
      }

      nextResolver({ value: this.resource, free: this.createFree() });
    });
  }

  read() {
    const { promise, resolve } = Promise.withResolvers<{
      value: T;
      free: () => void;
    }>();

    if (this.activeCount < this.maxConcurrent) {
      this.activeCount = this.activeCount + 1;

      resolve({
        value: this.resource,
        free: this.createFree(),
      });
    } else {
      this.waitingResolvers.push(resolve);
    }

    return promise;
  }

  withLock(criticalSection: (value: T) => void) {
    return this.read().then(({ value, free }) =>
      Promise.resolve()
        .then(() => criticalSection(value))
        .catch((err: any) => {
          console.log('Можем поглащать ошибки', `"${err}"`);
        })
        .finally(() => {
          free();
        })
    );
  }
}

export class Mutex<T> extends Semaphore<T> {
  constructor(resource: T) {
    super(resource, 1);
  }
}
