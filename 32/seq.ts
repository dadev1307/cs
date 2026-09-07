export async function* seq2<T>(...iters: AsyncIterable<T>[]) {
  for (const iter of iters) {
    yield* iter;
  }
}

export const seq = <T>(...iterables: AsyncIterable<T>[]) => {
  const iterators = iterables.map((iterable) =>
    iterable[Symbol.asyncIterator]()
  );
  let currentIteratorIndex = 0;
  let isDone: boolean | undefined;

  return {
    [Symbol.asyncIterator]() {
      return this;
    },
    async next() {
      while (!isDone) {
        let currentIterator = iterators[currentIteratorIndex];

        if (!currentIterator) {
          isDone = true;
          return { done: true, value: undefined };
        }

        const { done, value } = await currentIterator.next();

        if (done) {
          currentIteratorIndex++;
          continue;
        }

        return { done, value };
      }

      return { done: true, value: undefined };
    },
  };
};
