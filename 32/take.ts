export const take = (iterable: AsyncIterable<unknown>, count: number = 1) => {
  const iterator = iterable[Symbol.asyncIterator]();
  let remainingCount = count;

  return {
    [Symbol.asyncIterator]() {
      return this;
    },
    async next() {
      while (remainingCount) {
        const { done, value } = await iterator.next();
        remainingCount--;

        if (done) {
          return { done, value: undefined };
        }

        return { done, value };
      }

      return { done: true, value: undefined };
    },
  };
};
