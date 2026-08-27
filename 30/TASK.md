## Контейнер Patch

Необходимо реализовать контейнер `Patch`, который хранит снимок данных и очередь функций для оптимистичного обновления состояния. Исходные данные никогда не изменяются — функции накапливаются и применяются только при вызове `apply()`.

```typescript
const state = { likes: 10, tag: null };

// Функтор
const p1 = Patch.of(state).map((s) => ({ ...s, likes: s.likes + 1 }));

console.log(p1.apply()); // { likes: 11, tag: null }
console.log(state); // { likes: 10, tag: null } — не изменился

// Аппликатив
const add = Patch.of((n) => n + 1);
console.log(add.ap(Patch.of(10)).apply()); // 11

// Монада
const p2 = Patch.of(state)
  .map((s) => ({ ...s, likes: s.likes + 1 }))
  .flatMap((s) =>
    s.likes > 10 ? Patch.of({ ...s, tag: 'hot' }) : Patch.of(s)
  );

console.log(p2.apply()); // { likes: 11, tag: "hot" }
```

## Контейнер Validation

Реализуйте контейнер `Validation` для валидации данных с накоплением ошибок. В отличие от `Result`, который останавливается на первой ошибке, `Validation` собирает все ошибки. Контейнер может быть в двух состояниях: `Success` (данные валидны) и `Failure` (список ошибок).

```typescript
// Валидаторы
const isPositive = (v) =>
  v > 0
    ? Validation.success(v)
    : Validation.failure(['Значение должно быть положительным']);

const isEven = (v) =>
  v % 2 === 0
    ? Validation.success(v)
    : Validation.failure(['Значение должно быть чётным']);

// Накопление ошибок
const validateNumber = (v) =>
  Validation.success(v).flatMap(isPositive).flatMap(isEven);

const valid = validateNumber(4);
console.log(valid.getOrElse(0)); // 4
console.log(valid.isSuccess()); // true

const invalid = validateNumber(-3);
console.log(invalid.getOrElse(0)); // 0
console.log(invalid.getErrors()); // ["Значение должно быть положительным", "Значение должно быть чётным"]

// Использование ap для комбинирования
const validateUser = (name, age) =>
  Validation.success((name) => (age) => ({ name, age }))
    .ap(validateName(name))
    .ap(validateAge(age));
```
