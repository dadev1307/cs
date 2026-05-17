# BlockDeque

Двусторонняя очередь на связных блоках typed arrays. Для сравнения рядом оставлен `DequeRealloc` — дека на одном расширяемом typed array.

## API

```ts
new BlockDeque(ViewArrayConstructor, blockSize?)
```

- `**ViewArrayConstructor**` — конструктор typed array, например `Int32Array`.
- `**blockSize**` — число ячеек в одном блоке; по умолчанию `64`.
- **Методы** — `push`, `pop`, `unshift`, `shift`.
- `**count`** — текущее число элементов.

## Запуск

```sh
npm run 10
npm run 10:bench
```

## Бенчмарки

Сценарии: чистый рост через `push`/`unshift`, заполнение с последующим удалением через тот же край, смешанная steady-state нагрузка на двух концах.

### `100_000` операций

- `BlockDeque.push` — `1.30x` быстрее.
- `BlockDeque.unshift` — `1.57x` быстрее.
- `BlockDeque.push/pop` — `1.63x` быстрее.
- `BlockDeque.unshift/shift` — `1.56x` быстрее.
- `DequeRealloc mixed` — `1.03x` быстрее.

Вывод benchmark

```text
✓ 10/index.bench.ts > push: добавление 100000 элементов в хвост 1220ms
     name                     hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · DequeRealloc.push  1,379.78  0.5124  7.2260  0.7248  0.6974  2.8533  3.1357  7.2260  ±4.02%      690
   · BlockDeque.push    1,797.78  0.3127  2.5847  0.5562  0.6085  1.3490  2.1723  2.5847  ±2.56%      900

 ✓ 10/index.bench.ts > unshift: добавление 100000 элементов в голову 1212ms
     name                        hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · DequeRealloc.unshift  1,267.54  0.5748  8.4693  0.7889  0.7323  3.0247  4.0477  8.4693  ±5.10%      634
   · BlockDeque.unshift    1,990.98  0.2927  2.9357  0.5023  0.5495  1.1844  1.5926  2.9357  ±2.14%      996

 ✓ 10/index.bench.ts > push + pop: 100000 добавлений и 100000 удалений с хвоста 1216ms
     name                         hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · DequeRealloc.push/pop    672.25  1.2952  2.4179  1.4875  1.5077  2.1086  2.2392  2.4179  ±1.33%      337
   · BlockDeque.push/pop    1,097.31  0.6880  3.0003  0.9113  0.9551  1.1818  1.2051  3.0003  ±1.16%      549

 ✓ 10/index.bench.ts > unshift + shift: 100000 добавлений и 100000 удалений с головы 1220ms
     name                              hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · DequeRealloc.unshift/shift    694.19  0.9443  5.6351  1.4405  1.4628  2.7258  4.0597  5.6351  ±2.93%      348
   · BlockDeque.unshift/shift    1,083.91  0.7370  1.9832  0.9226  0.9533  1.3759  1.4363  1.9832  ±1.01%      542

 ✓ 10/index.bench.ts > mixed steady-state: 100000 операций на двух концах 1214ms
     name                                             hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · DequeRealloc mixed push/shift/unshift/pop  2,984.88  0.2742  0.6356  0.3350  0.3521  0.4223  0.4752  0.6251  ±0.46%     1493
   · BlockDeque mixed push/shift/unshift/pop    2,903.77  0.2655  1.5129  0.3444  0.3447  0.6610  0.6846  1.4791  ±1.26%     1452

 BENCH  Summary

  BlockDeque.push - 10/index.bench.ts > push: добавление 100000 элементов в хвост
    1.30x faster than DequeRealloc.push

  BlockDeque.unshift - 10/index.bench.ts > unshift: добавление 100000 элементов в голову
    1.57x faster than DequeRealloc.unshift

  BlockDeque.push/pop - 10/index.bench.ts > push + pop: 100000 добавлений и 100000 удалений с хвоста
    1.63x faster than DequeRealloc.push/pop

  BlockDeque.unshift/shift - 10/index.bench.ts > unshift + shift: 100000 добавлений и 100000 удалений с головы
    1.56x faster than DequeRealloc.unshift/shift

  DequeRealloc mixed push/shift/unshift/pop - 10/index.bench.ts > mixed steady-state: 100000 операций на двух концах
    1.03x faster than BlockDeque mixed push/shift/unshift/pop
```



### `10_000_000` операций

- `BlockDeque.push` — `1.40x` быстрее.
- `BlockDeque.unshift` — `1.52x` быстрее.
- `BlockDeque.push/pop` — `1.34x` быстрее.
- `BlockDeque.unshift/shift` — `1.33x` быстрее.
- `DequeRealloc mixed` — `1.15x` быстрее.

Вывод benchmark

```text
✓ 10/index.bench.ts > push: добавление 10000000 элементов в хвост 1898ms
     name                    hz      min      max     mean      p75      p99     p995     p999     rme  samples
   · DequeRealloc.push  16.2468  57.9196  64.4975  61.5506  63.8470  64.4975  64.4975  64.4975  ±3.10%       10
   · BlockDeque.push    22.7622  42.1116  45.7169  43.9326  44.6087  45.7169  45.7169  45.7169  ±1.50%       12

 ✓ 10/index.bench.ts > unshift: добавление 10000000 элементов в голову 2062ms
     name                       hz      min      max     mean      p75      p99     p995     p999     rme  samples
   · DequeRealloc.unshift  13.9297  68.9805  75.8200  71.7889  72.6737  75.8200  75.8200  75.8200  ±2.19%  10
   · BlockDeque.unshift    21.1909  44.2486  50.4606  47.1900  50.2411  50.4606  50.4606  50.4606  ±3.80%  11

 ✓ 10/index.bench.ts > push + pop: 10000000 добавлений и 10000000 удалений с хвоста 4220ms
     name                       hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · DequeRealloc.push/pop  7.1009  133.02  149.98  140.83  143.45  149.98  149.98  149.98  ±2.87%       10
   · BlockDeque.push/pop    9.5261  101.11  114.31  104.97  105.33  114.31  114.31  114.31  ±2.51%       10

 ✓ 10/index.bench.ts > unshift + shift: 10000000 добавлений и 10000000 удалений с головы 4251ms
     name                            hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · DequeRealloc.unshift/shift  6.9845  139.08  151.18  143.17  146.88  151.18  151.18  151.18  ±2.01%10
   · BlockDeque.unshift/shift    9.3198  101.15  124.64  107.30  107.14  124.64  124.64  124.64  ±4.79%10

 ✓ 10/index.bench.ts > mixed steady-state: 10000000 операций на двух концах 1509ms
     name                                            hz      min      max     mean      p75      p99     p995     p999     rme  samples
   · DequeRealloc mixed push/shift/unshift/pop  33.0064  28.5227  32.7460  30.2972  31.0525  32.7460  32.7460  32.7460  ±2.04%       17
   · BlockDeque mixed push/shift/unshift/pop    28.6969  32.4753  36.6266  34.8469  36.3188  36.6266  36.6266  36.6266  ±2.29%       15

 BENCH  Summary

  BlockDeque.push - 10/index.bench.ts > push: добавление 10000000 элементов в хвост
    1.40x faster than DequeRealloc.push

  BlockDeque.unshift - 10/index.bench.ts > unshift: добавление 10000000 элементов в голову
    1.52x faster than DequeRealloc.unshift

  BlockDeque.push/pop - 10/index.bench.ts > push + pop: 10000000 добавлений и 10000000 удалений с хвоста
    1.34x faster than DequeRealloc.push/pop

  BlockDeque.unshift/shift - 10/index.bench.ts > unshift + shift: 10000000 добавлений и 10000000 удалений с головы
    1.33x faster than DequeRealloc.unshift/shift

  DequeRealloc mixed push/shift/unshift/pop - 10/index.bench.ts > mixed steady-state: 10000000 операций на двух концах
    1.15x faster than BlockDeque mixed push/shift/unshift/pop
```



## Вывод

`BlockDeque` быстрее на чистом росте и сценариях полного заполнения с удалением: он добавляет блоки без копирования всего буфера, а при удалении отцепляет пустые крайние блоки.

`DequeRealloc` сжимает буфер на `pop`/`shift`, когда заполнение падает до `25%`, и не уменьшается ниже `initialCapacity`. Это решает проблему удержания максимальной ёмкости после пика, но добавляет копирование при сужении; в mixed steady-state сценарии он быстрее за счёт локальности одного typed array.

## Пример использования в коде

```ts
import { BlockDeque } from './index.ts';

const deque = new BlockDeque(Int32Array, 128);
deque.push(1);
deque.push(2);
deque.unshift(0); // порядок с головы: 0, 1, 2

console.log(deque.shift()); // 0
console.log(deque.pop()); // 2
console.log(deque.count); // 1
```

