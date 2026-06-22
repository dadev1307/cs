import { isDigit } from './digits.ts';

console.log(isDigit('1234567890'));
console.log(isDigit('1234567890abc'));
console.log(isDigit('Ⅻ1'));

const HIGH_SURROGATE_START = 0xd800;
const HIGH_SURROGATE_END = 0xdbff;
const LOW_SURROGATE_START = 0xdc00;
const LOW_SURROGATE_END = 0xdfff;

const decodeSurrogatePair = (highSurrogate: number, lowSurrogate: number) => {
  return (
    ((highSurrogate - HIGH_SURROGATE_START) << 10) +
    (lowSurrogate - LOW_SURROGATE_START) +
    0x10000
  );
};

function* iterateCodePoints(str: string) {
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    if (charCode >= HIGH_SURROGATE_START && charCode <= HIGH_SURROGATE_END) {
      const lowSurrogate = str.charCodeAt(i + 1);

      if (
        lowSurrogate >= LOW_SURROGATE_START &&
        lowSurrogate <= LOW_SURROGATE_END
      ) {
        yield decodeSurrogatePair(charCode, lowSurrogate);
        i++;
      } else {
        throw new Error('Invalid surrogate pair');
      }
    } else {
      yield charCode;
    }
  }
}

const splitIntoCodePoints = (str: string) =>
  [...iterateCodePoints(str)].map((codePoint) =>
    String.fromCodePoint(codePoint)
  );

// Третья часть ДЗ

function isExtend(codePoint: number) {
  return (
    (codePoint >= 768 && codePoint <= 879) || // 0x0300 — 0x036F (Основная диакритика, включая 769)
    (codePoint >= 7616 && codePoint <= 7679) || // 0x1DC0 — 0x1DFF (Доп. диакритика)
    (codePoint >= 8400 && codePoint <= 8447) || // 0x20D0 — 0x20FF (Знаки для символов)
    (codePoint >= 65056 && codePoint <= 65071) || // 0xFE20 — 0xFE2F (Полузнаки)
    (codePoint >= 127995 && codePoint <= 127999) || // 0x1F3FB — 0x1F3FF (Цвет кожи эмодзи)
    codePoint === 65039
  );
}

function isControl(codePoint: number) {
  return (
    (codePoint >= 0 && codePoint <= 31) || // ASCII управляющие символы (кроме CR/LF, но их мы отсекаем раньше или тут)
    (codePoint >= 127 && codePoint <= 159) || // Control (DEL и C1 Controls)
    (codePoint >= 8206 && codePoint <= 8207) || // Направление текста (LRM, RLM)
    (codePoint >= 8234 && codePoint <= 8238) || // Форматирование текста (LRE, RLE, PDF, LRO, RLO)
    (codePoint >= 8288 && codePoint <= 8303) || // Различные невидимые символы формата
    (codePoint >= 65520 && codePoint <= 65535) || // Спецсимволы (Specials, включая Replacement Character)
    (codePoint >= 917504 && codePoint <= 917631) // Теги формата (Deprecated tags)
  );
}

// Zero-Width Joiner
function isZWJ(codePoint: number) {
  return codePoint === 8205;
}

// Regional_Indicator
function isRI(codePoint: number) {
  return codePoint >= 127462 && codePoint <= 127487;
}

function shouldBreakBetween(
  previousCodePoint: number | undefined,
  nextCodePoint: number | undefined
) {
  if (!previousCodePoint || !nextCodePoint) return true;

  if (previousCodePoint === 13 && nextCodePoint === 10) return false; // \r\n
  if (previousCodePoint === 13 || previousCodePoint === 10) return true;
  if (nextCodePoint === 13 || nextCodePoint === 10) return true;

  if (isRI(previousCodePoint) && isRI(nextCodePoint)) return false;

  if (isControl(previousCodePoint) || isControl(nextCodePoint)) return true;

  if (isExtend(nextCodePoint) || isZWJ(nextCodePoint)) return false;
  if (isZWJ(previousCodePoint)) return false;

  return true;
}

function* iterateGraphemes(str: string) {
  const codePointIterator = iterateCodePoints(str);
  let next = codePointIterator.next();
  let done = next.done;

  let currentGrapheme = '';

  while (!done) {
    const currentCodePoint = next.value!;
    next = codePointIterator.next();
    done = next.done;

    const hasGraphemeBreak = shouldBreakBetween(currentCodePoint, next.value!);

    currentGrapheme += String.fromCodePoint(currentCodePoint);

    if (hasGraphemeBreak) {
      yield currentGrapheme;
      currentGrapheme = '';
      continue;
    }
  }
}

console.log([...splitIntoCodePoints('1😃à🇷🇺👩🏽‍❤️‍💋‍👨')]);
console.log([...iterateGraphemes('1😃à🇷🇺👩🏽‍❤️‍💋‍👨')]);
