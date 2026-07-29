import * as readline from 'readline';

const NEED_INPUT = Symbol('NEED_INPUT');
const FINISH = Symbol('FINISH');

function* range(start: number, stop: number) {
  while (start <= stop) {
    yield start.toString();
    start++;
  }
}

const DIGIT_CHARS = new Set(range(0, 9));

const isSpace = (char: string) => /\s/.test(char);

function* numberAutomaton(initialChunk: string): Generator<string | symbol> {
  let buffer = initialChunk;
  let cursor = 0;
  let state:
    | 'Skip'
    | 'Sign'
    | 'Int'
    | 'Frac'
    | 'MaybeFloat'
    | 'MaybeEndOrFloat'
    | 'MaybeEnd' = 'Skip';
  let lexeme: string[] = [];
  let previousChar: string | null = null;
  const trailingDotStates = ['MaybeFloat', 'MaybeEndOrFloat', 'MaybeEnd'];

  const resetAndAdvance = () => {
    cursor++;
    lexeme = [];
    state = 'Skip';
  };

  const canStartNumber = () => !previousChar || isSpace(previousChar);

  const joinLexeme = () => lexeme.join('');

  const flushNumberOnFinish = () => {
    if (trailingDotStates.includes(state)) {
      lexeme.pop();
      return joinLexeme();
    }

    if (state === 'Int' || state === 'Frac') {
      return joinLexeme();
    }

    return undefined;
  };

  while (true) {
    while (cursor >= buffer.length) {
      const chunk = yield NEED_INPUT;
      if (chunk === null || chunk === '') continue;

      if (chunk === FINISH) {
        const number = flushNumberOnFinish();
        if (number) {
          yield number;
        }

        return;
      }

      buffer = chunk;
      cursor = 0;
    }

    let char = buffer[cursor];
    const isDigit = DIGIT_CHARS.has(char);
    const isSpaceChar = isSpace(char);

    switch (state) {
      case 'Skip': {
        if (!canStartNumber()) {
          cursor++;
          break;
        }

        if (isDigit) {
          state = 'Int';
          lexeme.push(char);
        }

        if (char === '-' || char === '+') {
          state = 'Sign';
          lexeme.push(char);
        }

        if (char === '.') {
          state = 'MaybeFloat';
          lexeme.push(char);
        }

        cursor++;
        break;
      }

      case 'Sign': {
        if (isDigit) {
          lexeme.push(char);
          state = 'Int';
          cursor++;
          break;
        }

        if (char === '.') {
          lexeme.push(char);
          state = 'MaybeFloat';
          cursor++;
          break;
        }

        resetAndAdvance();

        break;
      }

      case 'Int': {
        if (isDigit) {
          lexeme.push(char);
          cursor++;
          break;
        }

        if (isSpace(char)) {
          yield joinLexeme();
          resetAndAdvance();
          break;
        }

        if (char === '.') {
          state = 'MaybeEndOrFloat';
          lexeme.push(char);
        }

        cursor++;
        break;
      }

      case 'Frac': {
        if (isDigit) {
          lexeme.push(char);
        }

        if (isSpace(char)) {
          yield joinLexeme();
          resetAndAdvance();
          break;
        }

        if (char === '.') {
          state = 'MaybeEnd';
          lexeme.push(char);
        }

        cursor++;
        break;
      }

      case 'MaybeEndOrFloat': {
        if (isSpaceChar) {
          lexeme.pop();
          yield joinLexeme();
          resetAndAdvance();
          break;
        }

        if (isDigit) {
          lexeme.push(char);
          state = 'Frac';
          cursor++;
          break;
        }

        resetAndAdvance();
        break;
      }

      case 'MaybeFloat': {
        if (isDigit) {
          lexeme.push(char);
          state = 'Frac';
          cursor++;
          break;
        }

        resetAndAdvance();
        break;
      }

      case 'MaybeEnd': {
        if (isSpaceChar) {
          lexeme.pop();
          yield joinLexeme();
          resetAndAdvance();
          break;
        }

        resetAndAdvance();
        break;
      }
    }

    previousChar = char;
  }
}

function getNumbers(source: string) {
  const automaton = numberAutomaton(source);
  let pendingChunk: string | symbol | undefined;

  return {
    next(chunk?: string) {
      if (chunk !== undefined) {
        pendingChunk = chunk;
        return { done: false, value: undefined };
      }

      if (pendingChunk === 'close') {
        pendingChunk = FINISH;
      }

      const step = automaton.next(chunk ?? pendingChunk);
      if (step.done) {
        return step;
      }

      if (step.value === NEED_INPUT) {
        throw new Error('Нужны ещё данные');
      }

      return { done: false, value: step.value };
    },

    [Symbol.iterator]() {
      return this;
    },
  };
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function promptInput(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });
}

async function mainInteractive() {
  let input = await promptInput('Введите текст: ');
  let numbers = getNumbers(input);

  while (true) {
    try {
      for (const number of numbers) {
        console.log(number);
      }

      break;
    } catch (err: any) {
      console.log('Ошибка:', err?.message ?? '');
      const additionalChunk = await promptInput('Введите ещё данные: ');

      numbers.next(additionalChunk);
    }
  }

  rl.close();
}
// Для завершения надо написать "close". Если при завершении ещё не вернулось валидное значение, то оно вернётся.
mainInteractive();

//'The price is 100.5 dollars, -5 degrees5, and .6 version 2.0.1 is out .05.'
