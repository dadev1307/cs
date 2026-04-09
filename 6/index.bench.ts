import { bench, describe } from 'vitest';

const SIZES = [100, 1_000, 10_000, 100_000] as const;
const OPS = 100_000;

function createArray(size: number): number[] {
  return Array.from({ length: size }, (_, i) => i);
}

function createHoleyArray(size: number): number[] {
  const arr = new Array(size);

  arr[Math.floor(size / 2)] = size;

  return arr;
}

describe('push (single)', () => {
  for (const size of SIZES) {
    const arr = createArray(size);
    bench(`size ${size}`, () => {
      arr.push(1);
    });
  }
});

describe('pop (single)', () => {
  for (const size of SIZES) {
    const arr = createArray(size);
    bench(`size ${size}`, () => {
      arr.pop();
    });
  }
});

describe('unshift (single)', () => {
  for (const size of SIZES) {
    const arr = createArray(size);
    bench(`size ${size}`, () => {
      arr.unshift(1);
    });
  }
});

describe('shift (single)', () => {
  for (const size of SIZES) {
    const arr = createArray(size);
    bench(`size ${size}`, () => {
      arr.shift();
    });
  }
});

describe('push (single) holey', () => {
  for (const size of SIZES) {
    const arr = createHoleyArray(size);
    bench(`size ${size}`, () => {
      arr.push(1);
    });
  }
});

describe('pop (single) holey', () => {
  for (const size of SIZES) {
    const arr = createHoleyArray(size);
    bench(`size ${size}`, () => {
      arr.pop();
    });
  }
});

describe('unshift (single) holey', () => {
  for (const size of SIZES) {
    const arr = createHoleyArray(size);
    bench(`size ${size}`, () => {
      arr.unshift(1);
    });
  }
});

describe('shift (single) holey', () => {
  for (const size of SIZES) {
    const arr = createHoleyArray(size);
    bench(`size ${size}`, () => {
      arr.shift();
    });
  }
});

describe('100k ops packed', () => {
  for (const size of SIZES) {
    bench(`size ${size}`, () => {
      const arr = createArray(size);

      for (let i = 0; i < OPS / 4; i++) {
        arr.push(i);
        arr.pop();
        arr.shift();
        arr.unshift(i);
      }
    });
  }
});

describe('100k ops holey', () => {
  for (const size of SIZES) {
    bench(`size ${size}`, () => {
      const arr = createHoleyArray(size);

      for (let i = 0; i < OPS / 4; i++) {
        arr.push(i);
        arr.pop();
        arr.shift();
        arr.unshift(i);
      }
    });
  }
});
