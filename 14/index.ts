export function indexOf<T, U>(
  array: T[],
  value: U,
  cb?: (item: T) => U
): number {
  let left = 0;
  let right = array.length - 1;
  let result = -1;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const itemValue = cb?.(array[middle]) ?? array[middle];

    if (itemValue === value) {
      result = middle;
      right = middle - 1;
    } else if (itemValue > value) {
      right = middle - 1;
    } else {
      left = middle + 1;
    }
  }

  return result;
}

export function lastIndexOf<T, U>(
  array: T[],
  value: U,
  cb?: (item: T) => U
): number {
  let left = 0;
  let right = array.length - 1;
  let result = -1;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const itemValue = cb?.(array[middle]) ?? array[middle];

    if (itemValue === value) {
      result = middle;
      left = middle + 1;
    } else if (itemValue > value) {
      right = middle - 1;
    } else {
      left = middle + 1;
    }
  }

  return result;
}

// Исходный массив должен быть отсортирован по возрасту
const ages = [12, 42, 42, 42, 56];

const users = [
  { age: 12, name: 'Bob' },
  { age: 42, name: 'Ben' },
  { age: 42, name: 'Jack' },
  { age: 42, name: 'Sam' },
  { age: 56, name: 'Bill' },
];

// Поиск по массиву чисел
console.log(indexOf(ages, 42)); // 1
console.log(lastIndexOf(ages, 42)); // 3

// Поиск по массиву объектов (по полю age)
console.log(indexOf(users, 42, (item) => item.age)); // 1
console.log(lastIndexOf(users, 42, (item) => item.age)); // 3

// Не найдено
console.log(indexOf(ages, 100)); // -1
console.log(lastIndexOf(ages, 100)); // -1
