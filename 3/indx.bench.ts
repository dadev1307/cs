import { bench } from 'vitest';

const N = 1_000_000;

bench(
  'Array + push (без прогрева)',
  () => {
    const arr: number[] = [];
    for (let i = 0; i < N; i++) {
      arr.push(i % 256);
    }
    new Uint8Array(arr);
  },
  {
    warmupTime: 0,
    warmupIterations: 0,
  }
);

bench('Array + push', () => {
  const arr: number[] = [];
  for (let i = 0; i < N; i++) {
    arr.push(i % 256);
  }
  new Uint8Array(arr);
});

bench(
  'Dynamic Uint8Array (без прогрева)',
  () => {
    let capacity = 2;
    let buffer = new Uint8Array(capacity);
    let len = 0;
    for (let i = 0; i < N; i++) {
      if (len === capacity) {
        capacity *= 2;
        const newBuffer = new Uint8Array(capacity);
        newBuffer.set(buffer);
        buffer = newBuffer;
      }
      buffer[len] = i % 256;
      len++;
    }
    buffer.subarray(0, len);
  },
  {
    warmupTime: 0,
    warmupIterations: 0,
  }
);

bench('Dynamic Uint8Array', () => {
  let capacity = 1024;
  let buffer = new Uint8Array(capacity);
  let len = 0;
  for (let i = 0; i < N; i++) {
    if (len === capacity) {
      capacity *= 2;
      const newBuffer = new Uint8Array(capacity);
      newBuffer.set(buffer);
      buffer = newBuffer;
    }
    buffer[len] = i % 256;
    len++;
  }
  buffer.subarray(0, len);
});
