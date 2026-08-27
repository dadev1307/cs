function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function timeout(promise: any, ms: number) {
  return sleep(ms).then(() => Promise.resolve(promise));
}

function promisify(originalFn: (...args: any[]) => any) {
  return function (this: any, ...args: any[]) {
    const callback = args.at(-1);

    if (typeof callback !== 'function') {
      throw new Error('Последний аргумент должен быть функцией');
    }

    return new Promise((resolve, reject) => {
      originalFn.call(this, ...args, (err: null | any, resolvedValue: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(resolvedValue);
        }
      });
    });
  };
}

function allLimit(tasks: Iterable<any>, concurrencyLimit: number) {
  const iterator = tasks[Symbol.iterator]();
  let startedCount = 0;
  let pendingCount = 0;
  let promises: any[] = [];
  let isDone = false;

  const { resolve, reject, promise } = Promise.withResolvers();

  const runNext = () => {
    startedCount++;

    if (isDone) {
      return;
    }

    const { value: task, done } = iterator.next();

    if (done) {
      isDone = true;
      return;
    }

    pendingCount++;
    const taskPromise = Promise.resolve(task);
    promises.push(taskPromise);

    taskPromise
      .then(() => {
        pendingCount--;
        if (pendingCount === 0 && isDone) {
          resolve(promises);
          return;
        }

        runNext();
      })
      .catch(reject);
  };

  while (pendingCount < concurrencyLimit) {
    runNext();
  }

  return promise;
}
