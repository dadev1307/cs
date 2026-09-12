import { IterSemaphore } from './IterSemaphore.ts';

const f1 = () =>
  new Promise((resolve) => {
    console.log('Запустился 1');
    setTimeout(() => {
      console.log('Выполнился 1');
      resolve(1);
    }, 11000);
  });
const f2 = () =>
  new Promise((resolve, reject) => {
    console.log('Запустился 2');
    setTimeout(() => {
      console.log('Выполнился 2');
      reject('Ошибочка вышла 2');
    }, 2000);
  });
const f3 = () =>
  new Promise((resolve) => {
    console.log('Запустился 3');
    setTimeout(() => {
      console.log('Выполнился 3');
      resolve(3);
    }, 3000);
  });
const f4 = () =>
  new Promise((resolve) => {
    console.log('Запустился 4');
    setTimeout(() => {
      console.log('Выполнился 4');
      resolve(4);
    }, 4000);
  });
const f5 = () =>
  new Promise((resolve) => {
    console.log('Запустился 5');
    setTimeout(() => {
      console.log('Выполнился 5');
      resolve(5);
    }, 5000);
  });
const f6 = () =>
  new Promise((resolve) => {
    console.log('Запустился 6');
    setTimeout(() => {
      console.log('Выполнился 6');
      resolve(6);
    }, 6000);
  });

const limitedPromises = new IterSemaphore(2, [f1, f2, f3, f4, f5, f6]);

Promise.all(limitedPromises)
  .then((value) => {
    console.log(value);
    console.log('all done');
  })
  .catch((error) => {
    console.error(error);
    console.log('ERRROR');
  });
