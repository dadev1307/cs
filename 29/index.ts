import { Writer } from './Writer.ts';
import { Mutex } from './Mutex.ts';

const result = Writer.of(10)
  .map((v) => v * 2) // Лог не пополняется
  .flatMap((v) => new Writer(v + 5, ['Прибавили 5']))
  .flatMap((v) => new Writer(v / 5, ['Поделили на 5']))
  .tell('Новый лог');

const { value, log } = result.run();

console.log(value); // 5
console.log(log); // ["Прибавили 5", "Поделили на 5"]

const cell = new Mutex({ count: 0 });

async function increment(name: any) {
  const { value, free } = await cell.read(); // Ожидаем получение доступа
  value.count++;
  console.log(name, value.count);
  setTimeout(() => {
    free();
    free();
    free();
  }, Math.random() * 3000);
}

increment('A'); // A 1
increment('B'); // B 2 — дождется освобождения

cell.withLock((val) => {
  val.count = val.count * 10;
  console.log('WithLock', val.count);
}); // WithLock 20

increment('C'); // C 21

cell.withLock((val) => {
  throw 'Ошибочка вышла';
}); // Должен всё равно освободить доступ и к след шагу

increment('D'); // D 22
