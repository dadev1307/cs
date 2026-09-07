export const once = (target: EventTarget, eventName: string) => {
  let event: Event | null = null;
  let savedResolve: ((value: IteratorResult<Event>) => void) | null = null;

  const handler = (e: Event) => {
    if (savedResolve) {
      savedResolve({ value: e, done: true });
    } else {
      event = e;
    }
  };

  target.addEventListener(eventName, handler, { once: true });

  return {
    [Symbol.asyncIterator]() {
      return this;
    },

    async next() {
      if (event) {
        return { value: event, done: true };
      } else {
        return new Promise<IteratorResult<Event>>((resolve) => {
          savedResolve = resolve;
        });
      }
    },

    return() {
      target.removeEventListener(eventName, handler);
      savedResolve?.({ value: undefined, done: true });
    },
  };
};
