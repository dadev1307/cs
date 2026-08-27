## sleep

Необходимо написать функцию sleep, которая принимает количество миллисекунд и возвращает Promise.

```js
sleep(100).then(() => {
  console.log("I'm awake!");
});
```

## timeout

Необходимо написать функцию timeout, которая принимает Promise и количество миллисекунд, и возвращает Promise.

```js
// Через 200 мс Promise будет зареджекчен
timeout(fetch('//my-data'), 200).then(console.log).catch(console.error);
```

## promisify

Необходимо написать функцию promisify, которая принимает функцию с callback-ом в качестве последнего аргумента и возвращает новую функцию.
Новая функция вместо callback будет возвращать Promise.

```js
function readFile(file, cb) {
  cb(null, 'fileContent');
}

const readFilePromise = promisify(readFile);
readFilePromise('my-file.txt').then(console.log).catch(console.error);
```

## allLimit

Необходимо написать функцию allLimit, которая принимает Iterable функций, возвращающих Promise (или обычные значения), и лимит одновременных Promise.
Одновременно не должно быть больше заданного числа Promise в состоянии pending.

```js
allLimit([f1, f2, f3, f4, f5, f6], 2).then(console.log).catch(console.error);
```
