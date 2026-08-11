import { debounce } from './debounce.ts';
import { throttle } from './throttle.ts';
import { waterfall } from './waterfall.ts';

function laugh() {
  console.log('Ha-ha!');
}

const debouncedLaugh = debounce(laugh, 1000);

debouncedLaugh();
debouncedLaugh();
debouncedLaugh();
debouncedLaugh();
debouncedLaugh(); // Выполнится через 1000 мс

const throttledLaugh = throttle(laugh, 300);

throttledLaugh(); // Выполнится сразу
setTimeout(throttledLaugh, 200);
setTimeout(throttledLaugh, 400);

waterfall(
  [
    (next) => {
      // Первый аргумент next — это ошибка.
      // Если она не null, управление сразу должно переводиться на финальный callback.
      next(null, 'one', 'two');
    },

    (first, second, next) => {
      console.log(first); // one
      console.log(second); // two
      next(null, 'three');
    },

    (previous, next) => {
      console.log(previous); // three
      next(null, 'done');
    },
  ],
  (err, result) => {
    console.log(result); // done
  }
);

waterfall(
  new Set([
    (next) => {
      next('ha-ha!');
    },

    (previous, next) => {
      next(null, 'done');
    },
  ]),
  (err, result) => {
    console.log(err); // ha-ha!
    console.log(result); // undefined
  }
);
