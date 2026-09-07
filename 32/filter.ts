export const filter = <T>(
  iterable: AsyncIterable<T>,
  predicate: (value: T) => boolean
) => {
  const iterator = iterable[Symbol.asyncIterator]();
  let isDone: boolean | undefined;

  return {
    [Symbol.asyncIterator]() {
      return this;
    },
    async next() {
      while (!isDone) {
        const { value, done } = await iterator.next();
        isDone = done;

        if (done) {
          return { done, value: undefined };
        }

        const matchesPredicate = predicate(value);

        if (matchesPredicate) {
          return { done, value };
        }
      }

      return { done: true, value: undefined };
    },
  };
};
