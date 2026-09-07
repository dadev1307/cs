## Неблокирующий forEach

Реализуйте функцию forEach, которая должна обходить любой Iterable-объект любого размера. Работа функции не должна вызывать фризов (зависаний интерфейса). Функция должна возвращать Promise.

```typescript
const numbers = new Array(50e9).fill(0).map((_, i) => i);

forEach(numbers, (num, i, array) => {
  // Имитация полезной нагрузки, например, сложное вычисление
  array[i] = Math.sqrt(num) * Math.PI;
}).then((array) => {
  console.log('Все элементы обработаны', array);
});
```

## Улучшенный неблокирующий forEach

Доработайте функцию forEach так, чтобы несколько её одновременных вызовов гарантированно не вызывали фризов.

```typescript
let total = 0;

Promise.all([
  forEach(new Array(50e9), () => {
    total++;
  }),

  forEach(new Array(50e9), () => {
    total++;
  }),

  forEach(new Array(50e9), () => {
    total++;
  }),

  forEach(new Array(50e9), () => {
    total++;
  }),

  forEach(new Array(50e9), () => {
    total++;
  }),
]).then(() => {
  console.log(total);
});
```

## Неблокирующий forEach с поддержкой приоритетов

Доработайте функцию forEach, добавив возможность задания приоритетов выполнения задач.

```typescript
let total = 0;

// Запуск задач с замерами времени
const start = performance.now();

forEach(new Array(50e9), { priority: 'critical' }, () => {
  total++;
}).then(() => {
  console.log(
    `critical обработано за ${(performance.now() - start).toFixed(2)}мс`
  );
});

forEach(new Array(50e9), { priority: 'high' }, () => {
  total++;
}).then(() => {
  console.log(`high обработано за ${(performance.now() - start).toFixed(2)}мс`);
});

forEach(new Array(50e9), { priority: 'low' }, () => {
  total++;
}).then(() => {
  console.log(`low обработано за ${(performance.now() - start).toFixed(2)}мс`);
});

forEach(new Array(50e9), () => {
  total++;
}).then(() => {
  console.log(
    `default обработано за ${(performance.now() - start).toFixed(2)}мс`
  );
});

forEach(new Array(50e9), () => {
  total++;
}).then(() => {
  console.log(
    `default обработано за ${(performance.now() - start).toFixed(2)}мс`
  );
});
```
