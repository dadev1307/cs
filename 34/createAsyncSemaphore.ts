function createAsyncSemaphore<TFlags extends readonly string[], TResult>(
  task: () => TResult,
  ...flags: TFlags
) {
  let cachedResult: TResult;
  let hasExecuted = false;

  return function (flag: TFlags[number]): Promise<TResult> {
    return new Promise((resolve) => {
      // Условие скорее лишнее, т.к проверка на уровне типов есть
      if (!flags.includes(flag)) {
        throw new Error('Такого ключа не было');
      }

      if (!hasExecuted) {
        cachedResult = task();
        hasExecuted = true;
      }

      resolve(cachedResult);
    });
  };
}

const run = createAsyncSemaphore(
  () => {
    console.log('Boom!');
    return 121;
  },
  'foo',
  'bar'
);

run('foo').then(console.log); // 121

// Boom! (выводится только один раз)
run('bar').then(console.log); // 121
