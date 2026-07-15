// TASK A
const random = (min: number, max: number) => {
  return {
    next() {
      return {
        done: false,
        value: Math.floor(Math.random() * (max - min) + min),
      };
    },
  };
};

const randomInt = random(0, 100);
console.log(randomInt.next().value); // Случайное число от 0 до 100
console.log(randomInt.next().value);
console.log(randomInt.next().value);
console.log(randomInt.next().value);

// TASK B
class Range<T extends number | string> {
  private start: number;
  private end: number;
  private mode: 'int' | 'char';

  constructor(start: T, end: T) {
    if (typeof start === 'number' && typeof end === 'number') {
      this.start = start;
      this.end = end;
      this.mode = 'int';
    } else if (typeof start === 'string' && typeof end === 'string') {
      this.start = start.charCodeAt(0);
      this.end = end.charCodeAt(0);
      this.mode = 'char';
    } else {
      throw new Error('Invalid arguments type');
    }
  }

  private iterator(isReverse: boolean): Iterator<number> {
    let i = isReverse ? this.end : this.start;
    const end = isReverse ? this.start : this.end;
    const step = isReverse ? -1 : 1;
    const isNext = () => (isReverse ? i >= end : i <= end);

    return {
      next() {
        while (isNext()) {
          let value = i;
          i += step;
          return { done: false, value };
        }

        return { done: true, value: undefined };
      },
    };
  }

  private charIterator(isReverse: boolean): Iterator<string> {
    const baseIterator = this.iterator(isReverse);

    return {
      next() {
        const result = baseIterator.next();

        if (result.done) {
          return result;
        }

        return {
          done: false,
          value: String.fromCharCode(result.value!),
        };
      },
    };
  }

  [Symbol.iterator](): Iterator<number | string> {
    return this.mode === 'int'
      ? this.iterator(false)
      : this.charIterator(false);
  }

  reverse() {
    const iterator =
      this.mode === 'int' ? this.iterator(true) : this.charIterator(true);

    return {
      next: () => iterator.next(),
      [Symbol.iterator](): Iterator<number | string> {
        return this;
      },
    };
  }
}

const symbolRange = new Range('a', 'f');

console.log(Array.from(symbolRange)); // ["a", "b", "c", "d", "e", "f"]

const numberRange = new Range(-5, 1);

console.log(Array.from(numberRange.reverse())); // [1, 0, -1, -2, -3, -4, -5]

// TASK C

const querySelectorAllLazy = (selector: string, root: Element) => {
  const stack = [root];
  return {
    next() {
      while (stack.length) {
        const currentNode = stack.shift();

        if (currentNode && currentNode.matches(selector)) {
          return { done: false, value: currentNode };
        }

        if (currentNode && currentNode.children.length) {
          stack.push(...currentNode.children);
        }
      }

      return { done: true, value: undefined };
    },
  };
};

const iter = querySelectorAllLazy('.item', document.body);

// console.log(iter.next().value); // Первый элемент с классом .item
// console.log(iter.next().value); // Второй элемент
