## Поточная обработка событий

Реализуйте функции `on` и `once`. Каждая принимает источник событий и имя события, а возвращает асинхронный итерируемый
объект.
При досрочном выходе из `for await...of` обработчик события должен быть снят.

```typescript
for await (const e of on(document.body, 'click')) {
  console.log(e);
}
```

## Адаптеры асинхронных итераторов

Реализуйте адаптеры `filter`, `map`, `seq` и `take` из задания по итераторам так, чтобы они принимали и возвращали
асинхронные итерируемые объекты.

- `filter(iterable, predicate)` пропускает только элементы, для которых `predicate` возвращает истинное значение.
- `map(iterable, mapper)` преобразует каждый элемент.
- `seq(...iterables)` последовательно выдаёт элементы всех переданных источников.
- `take(iterable, count)` выдаёт не больше `count` элементов и затем завершает итерацию.
- Дополнительно: поддержите асинхронные `predicate` и `mapper`.

Пример использования:

```typescript
for await (const event of seq(
  once(document.body, 'mousedown'),
  take(on(document.body, 'mouseup'), 10)
)) {
  console.log(event);
}
```

## Реактивное программирование: Drag & Drop

Используя парадигму реактивного программирования реализуйте логику Drag & Drop.
Нюансы реализации остаются на ваше усмотрение.

```typescript
const box = document.getElementById('my-box');

const dnd = repeat(
  filter(
    seq(
      once(box, 'mousedown'),

      every(
        any(on(document.body, 'mousemove'), on(document.body, 'mouseup')),

        onlyEvent('mousemove')
      )
    ),

    onlyEvent('mousemove')
  )
);

forEach(dnd, (e) => {
  // Тут логика перемещения элемента
});
```
