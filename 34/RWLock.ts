class RWLock<T extends object> {
  private proxyBySource = new WeakMap<object, object>();
  private revokeCallbacks: Array<ReturnType<typeof Proxy.revocable>['revoke']> =
    [];
  private static isWriting: boolean = false;
  private static readerCount = 0;

  constructor(private resource: T) {}

  private wrapWithProxy(source: unknown, isWritable: boolean = false) {
    const self = this;

    if (typeof source !== 'object' || source === null) {
      return source;
    }

    const cachedProxy = this.proxyBySource.get(source);

    if (cachedProxy) {
      return cachedProxy;
    }

    const { proxy, revoke } = Proxy.revocable(source, {
      get(target, prop, receiver) {
        const propertyValue = Reflect.get(target, prop, receiver);
        return self.wrapWithProxy(propertyValue, isWritable);
      },
      set(target, prop, value, receiver) {
        if (!isWritable) {
          throw new Error('Запись запрещена');
        }

        return Reflect.set(target, prop, value, receiver);
      },
    });

    this.proxyBySource.set(source, proxy);
    this.revokeCallbacks.push(revoke);

    return proxy;
  }

  private resetState() {
    this.revokeCallbacks = [];
    this.proxyBySource = new WeakMap();
    RWLock.isWriting = false;
  }

  free() {
    this.revokeCallbacks.forEach((revoke) => revoke());
    RWLock.readerCount--;
    this.resetState();
  }

  get() {
    if (RWLock.isWriting) {
      throw new Error(
        'Объект в статусе редактирования, взаимодействие запрещенно'
      );
    }

    RWLock.readerCount++;

    const proxy = this.wrapWithProxy(this.resource) as T;

    return {
      proxy,
      free: this.free.bind(this),
      [Symbol.dispose]() {
        this.free();
      },
    };
  }

  getMut() {
    if (RWLock.readerCount) {
      throw new Error('Объект ещё используется, редактирование запрещенно');
    }

    RWLock.readerCount++;
    RWLock.isWriting = true;

    const proxy = this.wrapWithProxy(this.resource, true) as T;

    return {
      proxy,
      free: this.free.bind(this),
      [Symbol.dispose]() {
        this.free();
      },
    };
  }
}

const lock = new RWLock({ value: 1 });

{
  using readHandle = lock.get();
  const { proxy } = readHandle;

  console.log(proxy.value); // 1

  try {
    proxy.value = 2; // ❌ Исключение — запись запрещена
  } catch (error) {
    console.error(error);
  }

  try {
    lock.getMut(); // ❌ Исключение — уже есть читающие
  } catch (error) {
    console.error(error);
  }

  console.log(proxy.value); // ❌ Исключение — доступ отозван
}

{
  const { proxy, free } = lock.getMut();

  proxy.value += 2;

  console.log(proxy.value); // 3

  try {
    lock.get(); // ❌ Исключение — уже есть пишущий
  } catch (err) {
    console.log(err);
  }

  free();
}
