## Контейнер Result

Необходимо написать контейнер Result с двумя состояниями: Ok и Err.

```typescript
const res1 = new Result(() => 42);

res1.then((data) => {
  console.log(data); // 42
});

const res2 = new Result(() => {
  throw 'Boom!';
});

res2
  .then((data) => {
    // Этот callback не вызовется
    console.log(data);
  })
  .catch((err) => {
    console.error(err); // Boom!
  });
```

## async/await для Result

Необходимо, используя генераторы, создать аналог async/await для контейнера Result.

```typescript
exec(function* main() {
  const res1 = new Result(() => 42);
  console.log(yield res1); // 42

  try {
    const res2 = yield new Result(() => {
      throw 'Boom!';
    });
  } catch (err) {
    console.error(err); // Boom!
  }
});
```
