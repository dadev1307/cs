const instructions = {
  'SET A': 0,
  'PRINT A': 1,
  'IFN A': 2,
  RET: 3,
  'DEC A': 4,
  JMP: 5,
};

const program = [
  // Ставим значения аккумулятора
  instructions['SET A'],
  // В 10
  10,

  // Выводим значение на экран
  instructions['PRINT A'],

  // Если A равно 0
  instructions['IFN A'],

  // Программа завершается
  instructions['RET'],

  // И возвращает 0
  0,

  // Уменьшаем A на 1
  instructions['DEC A'],

  // Устанавливаем курсор выполняемой инструкции
  instructions['JMP'],

  // В значение 2
  2,
];

const executeInstructions = {
  [instructions['SET A']]: ({ acc, instructionPointer, program }) => {
    const nextValue = program[instructionPointer.value + 1];

    const isNextCommand = nextValue !== undefined;

    if (!isNextCommand) {
      throw new Error('Отсутствует следующее значение');
    }

    if (isNaN(nextValue)) {
      throw new Error('Следующее значение должно быть числом');
    }

    acc.value = nextValue;
    instructionPointer.value = instructionPointer.value + 2;
  },
  [instructions['PRINT A']]: ({ acc, instructionPointer }) => {
    console.log(acc.value);
    instructionPointer.value = instructionPointer.value + 1;
  },
  [instructions['IFN A']]: ({ acc, instructionPointer, program }) => {
    if (acc.value !== 0) {
      instructionPointer.value = instructionPointer.value + 3;
      return;
    }

    instructionPointer.value = instructionPointer.value + 1;
  },
  [instructions['RET']]: ({ acc, instructionPointer, program }) => {
    const nextValue = program[instructionPointer.value + 1]; // undefined - можно считать и значением.
    return { value: nextValue };
  },
  [instructions['DEC A']]: ({ acc, instructionPointer, program }) => {
    acc.value = acc.value - 1;
    instructionPointer.value = instructionPointer.value + 1;
  },
  [instructions['JMP']]: ({ acc, instructionPointer, program }) => {
    const isNextValue = program[instructionPointer.value + 1] !== undefined;
    const nextValue = program[instructionPointer.value + 1];

    if (!isNextValue) {
      throw new Error('Отсутствует следующее значение');
    }

    if (isNaN(nextValue)) {
      throw new Error('Следующее значение должно быть числом');
    }

    const isJumpToInstruction = !isNaN(program[nextValue]);

    if (!isJumpToInstruction) {
      throw new Error('Перейти можно только к инструкции');
    }

    instructionPointer.value = nextValue;
  },
};

function execute(program) {
  let acc = {
    value: undefined,
  };

  let instructionPointer = {
    value: 0,
  };

  while (instructionPointer.value < program.length) {
    const command = program[instructionPointer.value];

    if (command === undefined) {
      throw new Error('Такой команды не существует');
    }

    const returnedEntity = executeInstructions[command]({
      acc,
      instructionPointer,
      program,
    });

    if (returnedEntity !== undefined) {
      return returnedEntity.value;
    }
  }
}

function execute2(program) {
  const {
    'SET A': SET,
    'PRINT A': PRINT,
    'IFN A': IFN,
    RET,
    'DEC A': DEC,
    JMP,
  } = instructions;

  let acc = 0;
  let ip = 0;

  function readArg() {
    const value = program[ip + 1];
    if (value === undefined || isNaN(value)) {
      throw new Error('Ожидается числовой аргумент');
    }
    return value;
  }

  function* run() {
    while (ip < program.length) {
      const opcode = program[ip];

      switch (opcode) {
        case SET:
          acc = readArg();
          ip += 2;
          break;

        case PRINT:
          console.log(acc);
          ip += 1;
          break;

        case IFN:
          ip += acc === 0 ? 1 : 3;
          break;

        case RET:
          return program[ip + 1];

        case DEC:
          acc -= 1;
          ip += 1;
          break;

        case JMP: {
          const target = readArg();
          if (program[target] === undefined || isNaN(program[target])) {
            throw new Error('Перейти можно только к инструкции');
          }
          ip = target;
          break;
        }

        default:
          throw new Error('Такой команды не существует');
      }

      yield { acc, ip };
    }
  }

  const gen = run();
  let step;
  while (!(step = gen.next()).done);
  return step.value;
}

execute(program);

console.log('--- execute2 ---');
execute2(program);
