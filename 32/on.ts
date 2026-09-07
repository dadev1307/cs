export const on = (target: EventTarget, event: string) => {
  const queue: Event[] = [];
  const resolves: Array<(value: IteratorResult<Event>) => void> = [];

  const handler = (e: Event) => {
    if (resolves.length > 0) {
      const resolve = resolves.shift()!;
      resolve({ value: e, done: false });
    } else {
      queue.push(e);
    }
  };

  target.addEventListener(event, handler);

  return {
    [Symbol.asyncIterator]() {
      return this;
    },

    async next() {
      if (queue.length > 0) {
        return { value: queue.shift()!, done: false };
      }

      return new Promise<IteratorResult<Event>>((resolve) => {
        resolves.push(resolve);
      });
    },

    return() {
      target.removeEventListener(event, handler);
      resolves.forEach((resolve) => resolve({ value: undefined, done: true }));

      return Promise.resolve({ value: undefined, done: true });
    },
  };
};
