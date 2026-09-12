// Синхронный и создаёт сразу promise когда попросит. А значит Promise.all сначала запустит все пустышки промисов, а выполнять будет по логике семафора, но если ошибка будет в первом промисе, то Promise.all вернёт значение, но оставшиеся промисы всё равно запустятся, т.к Promise.all уже поставил их в очередь. И это не проблема самого семаформа, скорее в самой идеи работать с методами промисов которые работают только с синхронными итераторами.
export class IterSemaphore<T, Task extends () => Promise<T> | T> {
  private availableSlots: number;
  private waitQueue: Array<[resolve: (value: unknown) => void, task: Task]> =
    [];

  constructor(
    public limit: number,
    public tasks: Iterable<Task>
  ) {
    this.tasks = tasks;
    this.availableSlots = limit;
  }

  startPendingTasks() {
    while (this.waitQueue.length && this.availableSlots > 0) {
      const [resolve, task] = this.waitQueue.shift()!;
      this.availableSlots--;
      resolve(Promise.try(task));
    }
  }

  [Symbol.iterator]() {
    const iterator = this.tasks[Symbol.iterator]();

    return {
      next: () => {
        const iteratorResult = iterator.next();

        if (iteratorResult.done) {
          return {
            value: undefined,
            done: true,
          };
        }

        const { resolve, promise } = Promise.withResolvers();
        promise
          .finally(() => {
            this.availableSlots++;
            this.startPendingTasks();
          })
          .catch(() => ({}));

        this.waitQueue.push([resolve, iteratorResult.value]);

        this.startPendingTasks();

        return {
          value: promise,
          done: false,
        };
      },
    };
  }
}
