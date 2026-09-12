const wrapper = (root: unknown) => {
  const revokes: Array<ReturnType<typeof Proxy.revocable>['revoke']> = [];

  if (typeof root !== 'object' || root === null) {
    return root;
  }

  const { proxy, revoke } = Proxy.revocable(root, {
    get(target, prop, receiver) {
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      return Reflect.set(target, prop, value, receiver);
    },
  });

  revokes.push(revoke);
};

class RWLock {
  constructor(private value: any) {}

  get() {
    const { proxy, revoke } = Proxy.revocable(this.value, {
      get(target, prop, receiver) {
        return Reflect.get(target, prop, receiver);
      },
      set(target, prop, value) {
        throw new Error('Запись запрещена');
      },
    });

    return {
      proxy,
      revoke,
      [Symbol.dispose]() {
        revoke();
      },
    };
  }

  getMut() {
    const { proxy, revoke } = Proxy.revocable(this.value, {
      get(target, prop) {
        return target[prop];
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      },
    });

    return {
      proxy,
      revoke,
      [Symbol.dispose]() {
        revoke();
      },
    };
  }
}

const lock = new RWLock({ value: 1 });

{
  using data = lock.get();
  const { proxy } = data;

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

// {
//   const { proxy, free } = lock.getMut();

//   proxy.value += 2;

//   console.log(proxy.value); // 3

//   try {
//     lock.get(); // ❌ Исключение — уже есть пишущий
//   } catch {}

//   free();
// }
