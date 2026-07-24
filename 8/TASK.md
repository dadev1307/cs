## Поточный парсер CSV с заданным разделителем

Реализуйте поточный (streaming) парсер CSV-файлов с заданным разделителем и сравнить его с нативной обработкой JSON.

**Что нужно сделать:**

- Написать парсер, который читает CSV построчно (или по чанкам), не загружая весь файл в память.
- Протестировать на файле ≥10 МБ, сравнив с аналогичными данными в JSON (используя `JSON.parse`).
  - Измерить и сравнить:
    - Общее время обработки
    - Время до первой записи (latency до начала получения данных)
    - Пиковое потребление памяти
    - Размер данных в CSV и JSON БЕЗ и СО сжатием

- (со звёздочкой): Добавить поддержку экранирования разделителя (например, "a,b" или a\,b).

```typescript
import * as fs from 'node:fs';
import * as readline from 'node:readline';

parseCSV('./very-big-csv', ',', (err, data) => {
  if (err != null) {
    console.error(err);
    return;
  }

  console.log(data);
});

function parseCSV(
  file: string,
  separator: string,
  cb: (err: Error | null, data: string[]) => void
) {
  const rl = readline.createInterface({
    input: fs.createReadStream(file),
    crlfDelay: Infinity,
  });

  rl.on('line', (line) => {
    // ...
  });

  rl.once('close', () => {
    // ...
  });
}
```

## Поточный парсинг CSV против MessagePack

Сравните ваш парсер CSV с MessagePack на больших файлах (файлы должны содержать одинаковый набор данных).
Оба парсера должны работать в потоке, не загружая данные целиком в память. Проанализируйте результат также, как и для JSON.

Для работы с MessagePack используйте https://www.npmjs.com/package/msgpackr (с помощью `PackrStream` и `UnpackrStream`).
