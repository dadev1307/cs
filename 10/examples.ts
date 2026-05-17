/**
 * Примеры проверки BlockDeque в Node.js:
 *   npx tsx 10/examples.ts
 */
import assert from 'node:assert/strict';
import { BlockDeque } from './index.ts';

function section(title: string, fn: () => void) {
  console.log(`\n--- ${title} ---`);
  fn();
  console.log('ok');
}

/** Ожидаемое LIFO: только push/pop в пределах одного блока */
function examplePushPopSmall() {
  const d = new BlockDeque(Int32Array, 8);
  assert.equal(d.push(10), 1);
  assert.equal(d.push(20), 2);
  assert.equal(d.push(30), 3);
  assert.equal(d.pop(), 30);
  assert.equal(d.pop(), 20);
  assert.equal(d.pop(), 10);
  assert.equal(d.pop(), undefined);
  assert.equal(d.shift(), undefined);
}

/** Несколько блоков: больше элементов, чем blockSize */
function examplePushAcrossBlocks() {
  const blockSize = 4;
  const d = new BlockDeque(Float64Array, blockSize);
  for (let i = 0; i < 11; i++) {
    d.push(i + 0.5);
  }
  assert.equal(d.count, 11);
  for (let i = 10; i >= 0; i--) {
    assert.equal(d.pop(), i + 0.5);
  }
  assert.equal(d.count, 0);
}

/** FIFO после того, как «голова» заполнена — через unshift/shift */
function exampleUnshiftShiftAfterHeadSliceFull() {
  const blockSize = 4;
  const d = new BlockDeque(Uint16Array, blockSize);
  for (let i = 0; i < blockSize; i++) {
    d.push(i);
  }
  d.unshift(100);
  d.unshift(101);
  assert.equal(d.shift(), 101);
  assert.equal(d.shift(), 100);
  for (let i = 0; i < blockSize; i++) {
    assert.equal(d.shift(), i);
  }
  assert.equal(d.shift(), undefined);
}

/** Чередование концов: unshift только после того, как текущий блок с хвоста заполнен */
function exampleInterleaved() {
  const d = new BlockDeque(Int32Array, 3);
  d.push(1);
  d.push(2);
  d.push(3);
  assert.equal(d.unshift(0), 4);
  assert.equal(d.shift(), 0);
  assert.equal(d.shift(), 1);
  assert.equal(d.pop(), 3);
  d.push(4);
  assert.equal(d.shift(), 2);
  assert.equal(d.pop(), 4);
  assert.equal(d.count, 0);
}

/** Пустая дека: pop/shift не бросают, возвращают undefined */
function exampleEmptyReads() {
  const d = new BlockDeque(Int32Array, 16);
  assert.equal(d.pop(), undefined);
  assert.equal(d.shift(), undefined);
}

/** Много циклов push/pop без утечки логических индексов */
function exampleStressPushPop() {
  const d = new BlockDeque(Int32Array, 32);
  for (let round = 0; round < 50; round++) {
    for (let i = 0; i < 100; i++) {
      d.push(i);
    }
    for (let i = 99; i >= 0; i--) {
      assert.equal(d.pop(), i);
    }
  }
  assert.equal(d.count, 0);
}

function main() {
  section('push/pop в одном блоке', examplePushPopSmall);
  section('push/pop через несколько блоков', examplePushAcrossBlocks);
  section(
    'unshift/shift после заполнения блока с хвоста',
    exampleUnshiftShiftAfterHeadSliceFull
  );
  section('чередование push/pop и unshift/shift', exampleInterleaved);
  section('чтение с пустой деки', exampleEmptyReads);
  section('стресс push/pop', exampleStressPushPop);
  console.log('\nВсе примеры прошли.');
}

main();
