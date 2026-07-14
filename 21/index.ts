const zipStr = (str: string) => str.replace(/(.)\1+/g, '$1');

console.log(zipStr('abbaabbafffbezza')); // abafbeza

const format = (str: string, obj: Record<string, string | number>) => {
  return str.replace(/\${(\w+)}/g, (_, key) => {
    return obj[key]?.toString() ?? '';
  });
};

console.log(
  format('Hello, ${user}! Your age is ${age}.', { user: 'Bob', age: 10 })
);

function calc(str: string) {
  const regexp = /(\d|\()[ \t]*[\d\s+\-*/()**]+\d[ \t]*\)?/g;

  return str.replace(regexp, (match, key) => {
    return new Function(`return ${match}`)();
  });
}

console.log(
  calc(`
    Какой-то текст (10 + 15 - 24) ** 2
    Еще какой-то текст 2 * 10
    `) ==
    `
    Какой-то текст 1
    Еще какой-то текст 20
    `
);
