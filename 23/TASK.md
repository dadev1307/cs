## Итератор по случайным числам

Необходимо написать функцию-генератор для создания итератора, генерирующего случайные числа в заданном диапазоне.

```js
const randomInt = random(0, 100);

console.log(randomInt.next().value); // Случайное число от 0 до 100
console.log(randomInt.next().value);
console.log(randomInt.next().value);
console.log(randomInt.next().value);
```

## Итератор по диапазонам значений

Необходимо написать класс Range, который позволяет создавать диапазоны чисел или символов и обходить элементы Range с любого конца.

```js
const symbolRange = new Range('a', 'f');

console.log(Array.from(symbolRange)); // ["a", "b", "c", "d", "e", "f"]

const numberRange = new Range(-5, 1);

console.log(Array.from(numberRange.reverse())); // [1, 0, -1, -2, -3, -4, -5]
```

## Итератор по DOM с селектором

Необходимо написать функцию-итератор для поиска DOM-узлов, начиная с заданного, по CSS-селектору. Функция должна работать лениво и не запускать поиск сразу по всему DOM-дереву, а выполнять его по мере необходимости (при каждом вызове next()).

```js
const iter = querySelectorAllLazy('.item', document.body);

console.log(iter.next().value); // Первый элемент с классом .item
console.log(iter.next().value); // Второй элемент

// Поиск продолжается только при вызове next()
```
