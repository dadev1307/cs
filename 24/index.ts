const random = (min: number, max: number) => {
  return Iterator.from({
    next() {
      return {
        done: false,
        value: Math.floor(Math.random() * (max - min) + min),
      };
    },
  });
};

const take = (iterable: Iterable<unknown>, count: number = 1) => {
  const iterator = iterable[Symbol.iterator]();
  let remainingCount = count;

  return Iterator.from({
    next() {
      while (remainingCount) {
        const { done, value } = iterator.next();
        remainingCount--;

        if (done) {
          return { done, value: undefined };
        }

        return { done, value };
      }

      return { done: true, value: undefined };
    },
  });
};

const randomInt = random(0, 100);

console.log([...take(randomInt, 5)]);

const filter = <T>(iterable: Iterable<T>, predicate: (value: T) => boolean) => {
  const iterator = iterable[Symbol.iterator]();
  let isDone: boolean | undefined;

  return Iterator.from({
    next() {
      while (!isDone) {
        const { value, done } = iterator.next();
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
  });
};

console.log([
  ...take(
    filter(randomInt, (value) => value > 90),
    5
  ),
]);

const enumerate = <T>(iterable: Iterable<T>) => {
  const iterator = iterable[Symbol.iterator]();
  let index = 0;
  let isDone: boolean | undefined = false;

  return Iterator.from({
    next() {
      while (!isDone) {
        const { done, value } = iterator.next();
        isDone = done;

        if (done) {
          return { done, value };
        }

        return { done, value: [index++, value] };
      }

      return { done: true, value: undefined };
    },
  });
};

console.log([...take(enumerate(randomInt), 3)]); // [[0, ...], [1, ...], [2, ...]]

const seq = (...iterables: Iterable<unknown>[]) => {
  const iterators = iterables.map((iterable) => iterable[Symbol.iterator]());
  let currentIteratorIndex = 0;
  let isDone: boolean | undefined;

  return Iterator.from({
    next() {
      while (!isDone) {
        let currentIterator = iterators[currentIteratorIndex];

        if (!currentIterator) {
          isDone = true;
          return { done: true, value: undefined };
        }

        const { done, value } = currentIterator.next();

        if (done) {
          currentIteratorIndex++;
          continue;
        }

        return { done, value };
      }

      return { done: true, value: undefined };
    },
  });
};

console.log([...seq([1, 2], new Set([3, 4]), 'bla')]); // [1, 2, 3, 4, 'b', 'l', 'a']

const mapSeq = <T>(
  iterable: Iterable<T>,
  mappers: Iterable<(value: any) => any>
) => {
  const createMapperIterator = () => mappers[Symbol.iterator]();
  const iterator = iterable[Symbol.iterator]();
  let mapperIterator = createMapperIterator();

  let isDone: undefined | boolean;

  return Iterator.from({
    next() {
      while (!isDone) {
        const { done, value } = iterator.next();

        if (done) {
          isDone = true;
          return { done, value: undefined };
        }

        let mappedValue = value;

        while (true) {
          const { value: mapper, done: isMappersExhausted } =
            mapperIterator.next();

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
  });
};

console.log([
  ...mapSeq([1, 2, 3], [(value) => value * 2, (value) => value - 1]),
]); // [1, 3, 5]
