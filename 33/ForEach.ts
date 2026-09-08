type Task<T = any> = {
  iterator: Iterator<T>;
  index: number;
  array: T[];
  callback: (item: T, index: number, array: T[]) => void;
  resolve: (value: void) => void;
  reject: (reason?: any) => void;
};

const Priorities = {
  critical: 'critical',
  high: 'high',
  low: 'low',
} as const;

type Priority = keyof typeof Priorities;

const queuesByPriority: { [K in Priority]: Task[] } = {
  [Priorities.critical]: [],
  [Priorities.high]: [],
  [Priorities.low]: [],
};

const priorityOrder = [Priorities.critical, Priorities.high, Priorities.low];

let isSchedulerRunning = false;
let activePriority: Priority = Priorities.critical;
let activeTaskIndex = 0;

function removeCurrentTask() {
  queuesByPriority[activePriority].splice(activeTaskIndex, 1);
  activeTaskIndex--;
  advanceActiveTaskIndex();
}

function resolveTask(task: Task<unknown>) {
  task.resolve();
  removeCurrentTask();
}

function rejectTask(task: Task<unknown>, reason: unknown) {
  task.reject(reason);
  removeCurrentTask();
}

function selectNextTask() {
  for (const priority of priorityOrder) {
    if (!queuesByPriority[priority].length) {
      continue;
    }

    if (priority !== activePriority) {
      activeTaskIndex = 0;
      activePriority = priority;
    }

    return queuesByPriority[priority][activeTaskIndex];
  }
}

function processNextItem<T>(task: Task<T>) {
  const iteratorResult = task.iterator.next();

  if (iteratorResult.done) {
    return true;
  }

  task.callback(iteratorResult.value, task.index, task.array);
  task.index = task.index + 1;

  return false;
}

function advanceActiveTaskIndex() {
  const nextTaskIndex = activeTaskIndex + 1;

  const currentQueue = queuesByPriority[activePriority];

  activeTaskIndex = nextTaskIndex >= currentQueue.length ? 0 : nextTaskIndex;
}

async function runScheduler() {
  isSchedulerRunning = true;

  outer: while (true) {
    const frameDeadline = performance.now() + 16;

    while (performance.now() < frameDeadline) {
      let task = selectNextTask();

      if (!task) {
        break outer;
      }

      try {
        const isFinished = processNextItem(task);
        if (isFinished) {
          resolveTask(task);
        } else {
          advanceActiveTaskIndex();
        }
      } catch (e: unknown) {
        rejectTask(task, e);
      }
    }

    await new Promise((r) => setTimeout(r, 0));
  }

  isSchedulerRunning = false;
}

export function forEach<T>(
  iterable: Iterable<T>,
  callback: (item: T, index: number, array: T[]) => void,
  options: { priority: Priority } = { priority: Priorities.low }
) {
  const { resolve, reject, promise } = Promise.withResolvers<void>();

  queuesByPriority[options.priority].push({
    iterator: iterable[Symbol.iterator](),
    index: 0,
    array: Array.isArray(iterable) ? iterable : [],
    callback,
    resolve,
    reject,
  });

  if (!isSchedulerRunning) {
    runScheduler();
  }

  return promise;
}
