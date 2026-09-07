export const map = <T>(
  iterable: AsyncIterable<T>,
  mappers: AsyncIterable<(value: any) => any>
) => {
  const createMapperIterator = () => mappers[Symbol.asyncIterator]();
  const iterator = iterable[Symbol.asyncIterator]();
  let mapperIterator = createMapperIterator();

  let isDone: undefined | boolean;

  return {
    [Symbol.asyncIterator]() {
      return this;
    },
    async next() {
      while (!isDone) {
        const { done, value } = await iterator.next();

        if (done) {
          isDone = true;
          return { done, value: undefined };
        }

        let mappedValue = value;

        while (true) {
          const { value: mapper, done: isMappersExhausted } =
            await mapperIterator.next();

          if (isMappersExhausted) {
            mapperIterator = createMapperIterator();
            break;
          }

          mappedValue = mapper(mappedValue);
        }

        return { done, value: mappedValue };
      }

      return { done: true, value: undefined };
    },
  };
};
