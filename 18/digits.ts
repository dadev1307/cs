const LATIN_DIGITS: [number, number] = [48, 57];
const ARABIC_INDIC_DIGITS: [number, number] = [1632, 1641];
const EASTERN_ARABIC_DIGITS: [number, number] = [1776, 1785];
const DEVANAGARI_DIGITS: [number, number] = [2406, 2415];
const BENGALI_DIGITS: [number, number] = [2534, 2543];
const GURMUKHI_DIGITS: [number, number] = [2662, 2671];
const GUJARATI_DIGITS: [number, number] = [2790, 2799];
const ORIYA_DIGITS: [number, number] = [2918, 2927];
const TAMIL_DIGITS: [number, number] = [3046, 3055];
const TELUGU_DIGITS: [number, number] = [3174, 3183];
const KANNADA_DIGITS: [number, number] = [3302, 3311];
const MALAYALAM_DIGITS: [number, number] = [3430, 3439];
const SINHALA_DIGITS: [number, number] = [3558, 3567];
const THAI_DIGITS: [number, number] = [3664, 3673];
const LAO_DIGITS: [number, number] = [3792, 3801];
const TIBETAN_DIGITS: [number, number] = [3872, 3881];
const MYANMAR_DIGITS: [number, number] = [4160, 4169];
const SHAN_DIGITS: [number, number] = [4240, 4249];
const KHMER_DIGITS: [number, number] = [6160, 6169];
const MONGOLIAN_DIGITS: [number, number] = [6470, 6479];
const LIMBU_DIGITS: [number, number] = [6608, 6617];
const NEWA_DIGITS: [number, number] = [6784, 6793];
const TAI_LE_DIGITS: [number, number] = [6900, 6909];
const NEW_TAI_LUE_DIGITS: [number, number] = [6984, 6993];
const KHMER_ATHAROK_DIGITS: [number, number] = [7936, 7945];
const ROMAN_NUMERALS: [number, number] = [8544, 8584];
const CHAM_DIGITS: [number, number] = [9248, 9257];
const KAYAH_LI_DIGITS: [number, number] = [9312, 9321];
const TAI_THAM_HORA_DIGITS: [number, number] = [10160, 10169];
const TAI_THAM_THAM_MUANG_DIGITS: [number, number] = [10174, 10183];
const MEITEI_MAYEK_DIGITS: [number, number] = [11264, 11273];
const LANNA_DIGITS: [number, number] = [42608, 42617];
const SAURASHTRA_DIGITS: [number, number] = [43216, 43225];
const ROHINGYA_DIGITS: [number, number] = [43248, 43257];
const CHAKMA_DIGITS: [number, number] = [43488, 43497];
const OL_CHIKI_DIGITS: [number, number] = [43712, 43721];
const FULLWIDTH_DIGITS: [number, number] = [65296, 65305];

const DIGIT_RANGES = [
  LATIN_DIGITS,
  ARABIC_INDIC_DIGITS,
  EASTERN_ARABIC_DIGITS,
  DEVANAGARI_DIGITS,
  BENGALI_DIGITS,
  GURMUKHI_DIGITS,
  GUJARATI_DIGITS,
  ORIYA_DIGITS,
  TAMIL_DIGITS,
  TELUGU_DIGITS,
  KANNADA_DIGITS,
  MALAYALAM_DIGITS,
  SINHALA_DIGITS,
  THAI_DIGITS,
  LAO_DIGITS,
  TIBETAN_DIGITS,
  MYANMAR_DIGITS,
  SHAN_DIGITS,
  KHMER_DIGITS,
  MONGOLIAN_DIGITS,
  LIMBU_DIGITS,
  NEWA_DIGITS,
  TAI_LE_DIGITS,
  NEW_TAI_LUE_DIGITS,
  KHMER_ATHAROK_DIGITS,
  ROMAN_NUMERALS,
  CHAM_DIGITS,
  KAYAH_LI_DIGITS,
  TAI_THAM_HORA_DIGITS,
  TAI_THAM_THAM_MUANG_DIGITS,
  MEITEI_MAYEK_DIGITS,
  LANNA_DIGITS,
  SAURASHTRA_DIGITS,
  ROHINGYA_DIGITS,
  CHAKMA_DIGITS,
  OL_CHIKI_DIGITS,
  FULLWIDTH_DIGITS,
];

const findDigitRange = (charCode: number) => {
  let left = 0;
  let right = DIGIT_RANGES.length - 1;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);

    const [rangeStart, rangeEnd] = DIGIT_RANGES[middle];

    if (charCode >= rangeStart && charCode <= rangeEnd) {
      return DIGIT_RANGES[middle];
    }

    if (charCode < rangeStart) {
      right = middle - 1;
    } else {
      left = middle + 1;
    }
  }

  return null;
};

export const isDigit = (input: string) => {
  let expectedDigitRange; // Необходимо что бы не мешать числа из разных диапазонов, но можно отказаться если нужно что бы числа можно было смешивать

  for (let i = 0; i < input.length; i++) {
    const charCode = input.charCodeAt(i);
    const digitRange = findDigitRange(charCode);
    if (!digitRange) {
      return false;
    }

    if (!expectedDigitRange) {
      expectedDigitRange = digitRange;
    }

    if (expectedDigitRange !== digitRange) {
      return false;
    }
  }

  return true;
};
