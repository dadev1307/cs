import { bench, describe } from 'vitest';
import { BlockDeque, DequeRealloc } from './index.ts';

const ITEMS = 10_000_000;
const BLOCK_SIZE = 1_024;
const MIXED_PREFILL = 10_000;

type IntDeque = BlockDeque<Int32Array> | DequeRealloc<Int32Array>;

let blackhole = 0;

function fillPush(deque: IntDeque, items = ITEMS) {
  for (let i = 0; i < items; i++) {
    deque.push(i);
  }

  return deque;
}

function fillUnshift(deque: IntDeque, items = ITEMS) {
  for (let i = 0; i < items; i++) {
    deque.unshift(i);
  }

  return deque;
}

describe(`push: добавление ${ITEMS} элементов в хвост`, () => {
  bench('DequeRealloc.push', () => {
    const deque = new DequeRealloc(Int32Array, BLOCK_SIZE);
    fillPush(deque);
    blackhole = deque.count;
  });

  bench('BlockDeque.push', () => {
    const deque = new BlockDeque(Int32Array, BLOCK_SIZE);
    fillPush(deque);
    blackhole = deque.count;
  });
});

describe(`unshift: добавление ${ITEMS} элементов в голову`, () => {
  bench('DequeRealloc.unshift', () => {
    const deque = new DequeRealloc(Int32Array, BLOCK_SIZE);
    fillUnshift(deque);
    blackhole = deque.count;
  });

  bench('BlockDeque.unshift', () => {
    const deque = new BlockDeque(Int32Array, BLOCK_SIZE);
    fillUnshift(deque);
    blackhole = deque.count;
  });
});

describe(`push + pop: ${ITEMS} добавлений и ${ITEMS} удалений с хвоста`, () => {
  bench('DequeRealloc.push/pop', () => {
    const deque = fillPush(new DequeRealloc(Int32Array, BLOCK_SIZE));
    let sink = 0;

    for (let i = 0; i < ITEMS; i++) {
      sink += deque.pop() ?? 0;
    }

    blackhole = sink;
  });

  bench('BlockDeque.push/pop', () => {
    const deque = fillPush(new BlockDeque(Int32Array, BLOCK_SIZE));
    let sink = 0;

    for (let i = 0; i < ITEMS; i++) {
      sink += deque.pop() ?? 0;
    }

    blackhole = sink;
  });
});

describe(`unshift + shift: ${ITEMS} добавлений и ${ITEMS} удалений с головы`, () => {
  bench('DequeRealloc.unshift/shift', () => {
    const deque = fillUnshift(new DequeRealloc(Int32Array, BLOCK_SIZE));
    let sink = 0;

    for (let i = 0; i < ITEMS; i++) {
      sink += deque.shift() ?? 0;
    }

    blackhole = sink;
  });

  bench('BlockDeque.unshift/shift', () => {
    const deque = fillUnshift(new BlockDeque(Int32Array, BLOCK_SIZE));
    let sink = 0;

    for (let i = 0; i < ITEMS; i++) {
      sink += deque.shift() ?? 0;
    }

    blackhole = sink;
  });
});

describe(`mixed steady-state: ${ITEMS} операций на двух концах`, () => {
  bench('DequeRealloc mixed push/shift/unshift/pop', () => {
    const deque = fillPush(
      new DequeRealloc(Int32Array, MIXED_PREFILL + 1),
      MIXED_PREFILL
    );
    let sink = 0;

    for (let i = 0; i < ITEMS / 4; i++) {
      deque.push(i);
      sink += deque.shift() ?? 0;
      deque.unshift(i);
      sink += deque.pop() ?? 0;
    }

    blackhole = sink;
  });

  bench('BlockDeque mixed push/shift/unshift/pop', () => {
    const deque = fillPush(
      new BlockDeque(Int32Array, BLOCK_SIZE),
      MIXED_PREFILL
    );
    let sink = 0;

    for (let i = 0; i < ITEMS / 4; i++) {
      deque.push(i);
      sink += deque.shift() ?? 0;
      deque.unshift(i);
      sink += deque.pop() ?? 0;
    }

    blackhole = sink;
  });
});
