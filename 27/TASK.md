## debounce

Необходимо написать функцию, которая принимает другую функцию и возвращает её debounce-версию.

```js
function laugh() {
  console.log('Ha-ha!');
}

const debouncedLaugh = debounce(laugh, 300);

debouncedLaugh();
debouncedLaugh();
debouncedLaugh();
debouncedLaugh();
debouncedLaugh(); // Выполнится через 300 мс
```

## throttle

Необходимо написать функцию, которая принимает другую функцию и возвращает её throttle-версию.

```js
function laugh() {
  console.log('Ha-ha!');
}

const throttledLaugh = throttle(laugh, 300);

throttledLaugh(); // Выполнится сразу
throttledLaugh();
throttledLaugh();
throttledLaugh();
throttledLaugh(); // Выполнится через 300 мс
```

## waterfall для callback-функций

Необходимо создать функцию для композиции асинхронного кода на callback-функциях, которая работает как показано на примере.

```js
waterfall(
  [
    (cb) => {
      // Первый аргумент cb — это ошибка.
      // Если она не null, выполнение сразу должно переводиться на финальный callback.
      cb(null, 'one', 'two');
    },

    (arg1, arg2, cb) => {
      console.log(arg1); // one
      console.log(arg2); // two
      cb(null, 'three');
    },

    (arg1, cb) => {
      console.log(arg1); // three
      cb(null, 'done');
    },
  ],
  (err, result) => {
    console.log(result); // done
  }
);

waterfall(
  new Set([
    (cb) => {
      cb('ha-ha!');
    },

    (arg1, cb) => {
      cb(null, 'done');
    },
  ]),
  (err, result) => {
    console.log(err); // ha-ha!
    console.log(result); // undefined
  }
);
```
