function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function timeout(promise: any, milliseconds: number) {
  return Promise.race([
    promise,
    sleep(milliseconds).then(() => Promise.reject('timeout')),
  ]);
}

function promisify(callbackFn: (...args: any[]) => void) {
  return function (this: any, ...args: any[]) {
    return new Promise((resolve, reject) => {
      callbackFn.call(this, ...args, (err: null | any, callbackResult: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(callbackResult);
        }
      });
    });
  };
}

function allLimit(tasks: Iterable<() => any>, concurrencyLimit: number) {
  const iterator = tasks[Symbol.iterator]();
  const { resolve, reject, promise } = Promise.withResolvers();
  const taskResults: any[] = [];
  let isFinished = false;
  let activeTaskCount = 0;
  let lastResultIndex = -1;

  const scheduleNextTasks = () => {
    if (isFinished && activeTaskCount === 0) {
      resolve(taskResults);
      return;
    }

    if (isFinished) {
      return;
    }

    while (activeTaskCount < concurrencyLimit) {
      const { value: task, done } = iterator.next();
      const resultIndex = ++lastResultIndex;

      if (done) {
        isFinished = true;
        return;
      }

      activeTaskCount++;

      Promise.try(task)
        .then((taskResult) => {
          activeTaskCount--;
          taskResults[resultIndex] = taskResult;

          scheduleNextTasks();
        })
        .catch((error) => {
          isFinished = true;
          reject(error);
        });
    }
  };

  scheduleNextTasks();

  return promise;
}

async function testAllLimit() {
  let activeTaskCount = 0;
  let peakActiveCount = 0;

  const createDelayedTask = (id: number, milliseconds: number) => () => {
    activeTaskCount++;
    peakActiveCount = Math.max(peakActiveCount, activeTaskCount);
    console.log(`start ${id}, running=${activeTaskCount}`);

    return sleep(milliseconds).then(() => {
      activeTaskCount--;
      console.log(`done ${id}`);

      return id;
    });
  };

  const taskResults = await allLimit(
    [
      createDelayedTask(1, 5300),
      createDelayedTask(2, 8000),
      createDelayedTask(3, 1200),
      createDelayedTask(4, 1500),
      createDelayedTask(5, 50),
      createDelayedTask(6, 50),
    ],
    2
  );

  console.log('results:', taskResults);
  console.log('max concurrent:', peakActiveCount);
}

testAllLimit().catch(console.error);
