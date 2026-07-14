const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

console.log(emailRegex.test('user@example.com')); // true
console.log(emailRegex.test('test@mail.ru')); // true
console.log(emailRegex.test('user123@domain.org')); // true
console.log(emailRegex.test('invalid-email')); // false
console.log(emailRegex.test('user@.com')); // false
console.log(emailRegex.test('user@domain')); // false
console.log(emailRegex.test('user@domain.c')); // false

const numberRegex = /(?<=\s|^)-?\d+\.?\d*/g;
const text = 'The price is 100.5 dollars, -5 degrees, and version2 is out.';

const numbers = text.match(numberRegex);
console.log(numbers); // [ '100.5', '-5' ]

const dateRegex =
  /([0-2][1-9]|3[0-1])(\.|-)(0[1-9]|1[0-2])(\.|-)(\d{4})|(\d{4})(\.|-)(0[1-9]|1[0-2])(\.|-)([0-2][1-9]|3[0-1])/g;
const text2 =
  'Today is 15.01.2025 and tomorrow is 2025-01-16. Invalid: 32.13.2025';

const dates = text2.match(dateRegex);
console.log(dates); // ["15.01.2025", "2025-01-16"]
