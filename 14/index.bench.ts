import { bench, describe } from 'vitest';

import { indexOf, lastIndexOf } from './index.js';

const SIZES = [1_000, 100_000, 1_000_000] as const;

/** Отсортированный массив [0, 1, …, size - 1] — условие для бинарного поиска */
function createSortedArray(size: number): number[] {
  return Array.from({ length: size }, (_, i) => i);
}

/**
 * Отсортированный массив с центральным блоком одинаковых значений needle.
 * indexOf → первый индекс блока, lastIndexOf → последний.
 */
function createSortedArrayWithDuplicates(size: number): {
  arr: number[];
  needle: number;
} {
  const needle = Math.floor(size / 2);
  const blockLen = Math.max(1, Math.floor(size * 0.1));
  const beforeLen = Math.floor((size - blockLen) / 2);
  const afterLen = size - beforeLen - blockLen;
  const arr = new Array<number>(size);

  for (let i = 0; i < beforeLen; i++) {
    arr[i] = needle - beforeLen + i;
  }
  for (let i = 0; i < blockLen; i++) {
    arr[beforeLen + i] = needle;
  }
  for (let i = 0; i < afterLen; i++) {
    arr[beforeLen + blockLen + i] = needle + 1 + i;
  }

  return { arr, needle };
}

describe('indexOf (уникальные значения, needle ≈ 75% длины)', () => {
  for (const size of SIZES) {
    const arr = createSortedArray(size);
    const needle = Math.floor(size * 0.75);

    bench(`custom binary, size ${size}`, () => {
      indexOf(arr, needle);
    });

    bench(`native Array.indexOf, size ${size}`, () => {
      arr.indexOf(needle);
    });
  }
});

describe('lastIndexOf (уникальные значения, needle ≈ 75% длины)', () => {
  for (const size of SIZES) {
    const arr = createSortedArray(size);
    const needle = Math.floor(size * 0.75);

    bench(`custom binary, size ${size}`, () => {
      lastIndexOf(arr, needle);
    });

    bench(`native Array.lastIndexOf, size ${size}`, () => {
      arr.lastIndexOf(needle);
    });
  }
});

describe('indexOf (блок дубликатов, первое вхождение)', () => {
  for (const size of SIZES) {
    const { arr, needle } = createSortedArrayWithDuplicates(size);

    bench(`custom binary, size ${size}`, () => {
      indexOf(arr, needle);
    });

    bench(`native Array.indexOf, size ${size}`, () => {
      arr.indexOf(needle);
    });
  }
});

describe('lastIndexOf (блок дубликатов, последнее вхождение)', () => {
  for (const size of SIZES) {
    const { arr, needle } = createSortedArrayWithDuplicates(size);

    bench(`custom binary, size ${size}`, () => {
      lastIndexOf(arr, needle);
    });

    bench(`native Array.lastIndexOf, size ${size}`, () => {
      arr.lastIndexOf(needle);
    });
  }
});
