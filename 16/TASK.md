## Ассоциативный массив на основе бинарного дерева поиска

Реализуйте класс TreeMap для создания ассоциативного массива (ключ → значение) на основе обычного бинарного дерева поиска (без балансировки).

```js
const map = new TreeMap();

map.set('banana', 3);
map.set('apple', 2);
map.set('cherry', 5);
map.set('date', 1);

console.log(map.get('apple')); // 2
console.log(map.has('banana')); // true
console.log(map.keys()); // ["apple", "banana", "cherry", "date"]

map.delete('cherry');
console.log(map.entries());
// [["apple", 2], ["banana", 3], ["date", 1]]
```

## Ассоциативный массив на бинарном дереве в плоском массиве

Реализуйте класс ArrayTreeMap для создания ассоциативного массива на основе плоского массива, используя формулы для хранения узлов:

- Левый потомок: `2 * i + 1`
- Правый потомок: `2 * i + 2`
- Родитель: `Math.floor((i - 1) / 2)`

```js
const map = new ArrayTreeMap(16); // Стартовая емкость

map.set(10, 'A');
map.set(5, 'B');
map.set(15, 'C');
map.set(3, 'D');
map.set(7, 'E');

console.log(map.get(7)); // "E"
console.log(map.keys()); // [3, 5, 7, 10, 15]
console.log(map.getIndex(10)); // 0
console.log(map.getIndex(7)); // 4
```
