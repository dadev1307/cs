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
  private isError = false;
  private error: unknown;

  constructor(
    private resource: T,
    private maxConcurrent: number
  ) {}

  createFree() {
    return once(() => {
      const [nextResolver, nextRejecter] = this.waitingResolvers.shift();

      if (!nextResolver && this.isError) {
        throw 'Ошибка';
      }

      if (!nextResolver) {
        this.activeCount = Math.min(this.activeCount + 1, this.maxConcurrent);
        return;
      }

      console.log(this.isError, this.resource, nextRejecter.toString());

      if (this.isError) {
        nextRejecter({ value: this.error, free: this.createFree() });
        return;
      }

      nextResolver({ value: this.resource, free: this.createFree() });
    });
  }

  read() {
    const { promise, resolve, reject } = Promise.withResolvers<{
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
      this.waitingResolvers.push([resolve, reject]);
    }

    return promise;
  }

  withLock(criticalSection: (value: T) => void) {
    return this.read().then(({ value, free }) =>
      Promise.resolve()
        .then(() => criticalSection(value))
        .catch((err: any) => {
          this.isError = true;
          this.error = err;
        })
        .finally(() => {
          free();
        })
    );
  }

  catch(cb: (error: unknown, lastState: T) => void) {
    const { promise, resolve, reject } = Promise.withResolvers<{
      value: T;
      free: () => void;
    }>();

    this.waitingResolvers.push([() => {}]);
  }
}

export class Mutex<T> extends Semaphore<T> {
  constructor(resource: T) {
    super(resource, 1);
  }
}
