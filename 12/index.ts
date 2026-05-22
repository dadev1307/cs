import { throws } from 'node:assert';
import { Memory, Pointer } from '../11/index.ts';

type PointerWithRc = Pointer & { clone(): PointerWithRc };

function withRc(pointer: Pointer) {
  let countRefs = 1;

  const createProxy = () =>
    new Proxy(pointer, {
      get(target, prop) {
        if (prop === 'clone') {
          return () => {
            countRefs++;
            return createProxy();
          };
        }

        if (prop === Symbol.dispose) {
          return () => {
            countRefs--;
            if (countRefs === 0) {
              target.free();
            }
          };
        }

        const value = Reflect.get(target, prop);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    }) as PointerWithRc;

  return createProxy();
}

const mem = new Memory(100 * 1024, { stack: 10 * 1024 });

let savedRef!: PointerWithRc;

{
  using local = withRc(mem.alloc(16));
  local.write(new Int32Array([42]));
  using pointer2 = local.clone();
  savedRef = pointer2;
}

// блок завершился, local уничтожен — указатель освобождён, savedRef устарел
throws(() => savedRef.deref(Int32Array), /Указатель уже освобождён/);
