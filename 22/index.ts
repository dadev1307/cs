const numberRegex = /-?(?<!\.)\b\d+(\.\d+)?(?!\.\d)|(?<!\d)\.\d+/g;
const text =
  'The price is 100.5 dollars, -5 degrees5, and .6 version 2.0.1 is out .05.';

const numbers = text.match(numberRegex);
console.log(numbers); // [ '100.5', '-5', '.6', '.05' ]

const passwordRegex =
  /\b(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,20}/;

console.log(passwordRegex.test('Password123!')); // true
console.log(passwordRegex.test('Pass!')); // false (меньше 8 символов)
console.log(passwordRegex.test('PASSWORD123!')); // false (нет строчных)
console.log(passwordRegex.test('Password!')); // false (нет цифры)
console.log(passwordRegex.test('Password123')); // false (нет спецсимвола)
console.log(passwordRegex.test('password123!')); // false (нет заглавных)
