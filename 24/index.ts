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
  let currenPosition = count;

  return Iterator.from({
    next() {
      while (currenPosition) {
        const { done, value } = iterator.next();
        currenPosition--;

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

const filter = <T>(iterable: Iterable<T>, predicate: (item: T) => boolean) => {
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

        const isPassed = predicate(value);

        if (isPassed) {
          return { done, value };
        }
      }

      return { done: true, value: undefined };
    },
  });
};

console.log([
  ...take(
    filter(randomInt, (el) => el > 90),
    5
  ),
]);

const enumerate = <T>(iterable: Iterable<T>) => {
  const iterator = iterable[Symbol.iterator]();
  let position = 0;
  let isDone: boolean | undefined = false;

  return Iterator.from({
    next() {
      while (!isDone) {
        const { done, value } = iterator.next();
        isDone = done;

        if (done) {
          return { done, value };
        }

        return { done, value: [position++, value] };
      }

      return { done: true, value: undefined };
    },
  });
};

console.log([...take(enumerate(randomInt), 3)]); // [[0, ...], [1, ...], [2, ...]]

const seq = (...iterables: Iterable<unknown>[]) => {
  const iterators = iterables.map((iterable) => iterable[Symbol.iterator]());
  let positionIterator = 0;
  let isDone: boolean | undefined;

  return Iterator.from({
    next() {
      while (!isDone) {
        let currentIterator = iterators[positionIterator];

        if (!currentIterator) {
          isDone = true;
          return { done: true, value: undefined };
        }

        const { done, value } = currentIterator.next();

        if (done) {
          positionIterator++;
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
  fnIterable: Iterable<(el: any) => any>
) => {
  const makeFnIterable = () => fnIterable[Symbol.iterator]();
  const iterator = iterable[Symbol.iterator]();
  let fnIterator = makeFnIterable();

  let isDone: undefined | boolean;

  return Iterator.from({
    next() {
      while (!isDone) {
        const { done, value } = iterator.next();

        if (done) {
          isDone = true;
          return { done, value: undefined };
        }

        let result = value;

        while (true) {
          const { value: cb, done: doneFn } = fnIterator.next();

          if (doneFn) {
            fnIterator = makeFnIterable();
            break;
          }

          result = cb(result);
        }

        return { done, value: result };
      }

      return { done: true, value: undefined };
    },
  });
};

console.log([...mapSeq([1, 2, 3], [(el) => el * 2, (el) => el - 1])]); // [1, 3, 5]
