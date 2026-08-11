type ParseResult<T> = [T, string] | null;
type Parser<T> = (input: string) => ParseResult<T>;

const take = (
  pattern: string | RegExp,
  options?: Partial<{ min: number; max: number }>
) => {
  const { min = 1, max = 1 } = options ?? {};

  const getMatchLength = createPrefixMatcher(pattern);

  const parseOnce = (input: string) => {
    const [isMatched, matchedLength] = getMatchLength(input);
    if (!isMatched) {
      return null;
    }

    return [input.substring(0, matchedLength), input.substring(matchedLength)];
  };

  return (input: string) => {
    let matched = '';
    let rest = input;
    let matchCount = 0;
    let isSuccess = false;

    while (matchCount < min) {
      const parseStep = parseOnce(rest);
      if (!parseStep) {
        return null;
      }

      const [matchedPart, remaining] = parseStep;

      matched = matched + matchedPart;
      rest = remaining;
      matchCount++;
    }

    isSuccess = true;

    while (matchCount < max) {
      const parseStep = parseOnce(rest);

      if (!parseStep) {
        return [matched, rest];
      }

      const [matchedPart, remaining] = parseStep;

      matched = matched + matchedPart;
      rest = remaining;
      matchCount++;
    }

    return [matched, rest];
  };
};

const createPrefixMatcher = (pattern: string | RegExp) => {
  if (typeof pattern === 'string') {
    return (input: string): [boolean, number] => {
      return [pattern === input, pattern.length];
    };
  }

  return (input: string): [boolean, number] => {
    const anchoredPattern = new RegExp(`^(?:${pattern.source})`);

    const match = input.match(anchoredPattern);

    const matchedLength = match ? match[0].length : 0;

    return [Boolean(match), matchedLength];
  };
};

const takeNumber = take(/\d\d/, { min: 1, max: 4 })('1234 foo');

console.log(takeNumber); // ['1234', ' foo']

const takeNumber2 = take(/\d/, { max: 2 })('1234 foo');

console.log(takeNumber2); // ['12', '34 foo']
