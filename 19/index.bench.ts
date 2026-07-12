import { bench, describe } from 'vitest';

import { CompactTrie } from './index.ts';
import { Trie } from './another.ts';

const WORD_COUNT = 10_000;
const LOOKUP_SAMPLE = 1_000;

type CharByteSize = 1 | 2 | 3 | 4;

type AlphabetSpec = {
  id: string;
  label: string;
  letters: string;
  prefixes: string[];
  minCharByteSize: CharByteSize;
  seed: number;
};

type MemoryRow = {
  alphabetId: string;
  impl: string;
  charByteSize: CharByteSize | null;
  bytesPerNode: number | null;
  nodeCount: number;
  /** Плотный buffer CompactTrie или retained heap Trie(Map) */
  usedBytes: number;
  allocBytes: number | null;
  lookupOk: number;
  lookupTotal: number;
  truncated: boolean;
};

function gc() {
  if (typeof globalThis.gc === 'function') {
    globalThis.gc();
    globalThis.gc();
  }
}

function memoryFootprint() {
  const usage = process.memoryUsage();
  return usage.heapUsed + usage.external;
}

/**
 * Retained heap+external для Trie(Map).
 * Важно: все измеренные Trie держим живыми (retainedLive),
 * иначе следующий замер переиспользует free-list V8 после GC
 * предыдущего Trie и даёт retained≈0 B (типично на 2-м алфавите).
 */
const retainedLive: unknown[] = [];

function measureRetainedBytes(factory: () => unknown) {
  gc();
  const before = memoryFootprint();
  const value = factory();
  retainedLive.push(value);
  gc();
  const after = memoryFootprint();
  if (value == null) throw new Error('factory returned nullish');
  return { value, bytes: Math.max(0, after - before) };
}

function buildRangeAlphabet(startCodePoint: number, count: number) {
  let letters = '';
  for (let i = 0; i < count; i++) {
    letters += String.fromCodePoint(startCodePoint + i);
  }
  return letters;
}

function maxCodePoint(text: string) {
  let max = 0;
  for (const char of text) {
    max = Math.max(max, char.codePointAt(0) ?? 0);
  }
  return max;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}

const ALPHABETS: AlphabetSpec[] = [
  {
    id: 'ascii',
    label: 'Латиница',
    letters: 'abcdefghijklmnopqrstuvwxyz',
    prefixes: [
      'pre',
      'anti',
      'over',
      'under',
      'semi',
      'multi',
      'trans',
      'inter',
      'super',
      'hyper',
    ],
    minCharByteSize: 1,
    seed: 42,
  },
  {
    id: 'cyrillic',
    label: 'Кириллица',
    letters: 'абвгдежзийклмнопрстуфхцчшщ',
    prefixes: [
      'пре',
      'анти',
      'сверх',
      'под',
      'полу',
      'много',
      'пере',
      'меж',
      'супер',
      'гипер',
    ],
    minCharByteSize: 2,
    seed: 43,
  },
  {
    id: 'cjk',
    label: 'Иероглифы',
    letters: buildRangeAlphabet(0x4e00, 26),
    prefixes: ['东', '西', '南', '北', '中', '上', '下', '大', '小', '新'],
    // 4 байта на символ (полный code point / запас под non-BMP)
    minCharByteSize: 4,
    seed: 44,
  },
];

let blackhole = 0;

function generateWords(alphabet: AlphabetSpec, count = WORD_COUNT) {
  let state = alphabet.seed >>> 0;
  const next = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state;
  };

  const letterList = [...alphabet.letters];
  const words = new Set<string>();

  while (words.size < count) {
    const prefix = alphabet.prefixes[next() % alphabet.prefixes.length];
    const length = 3 + (next() % 8);
    let body = '';

    for (let i = 0; i < length; i++) {
      body += letterList[next() % letterList.length];
    }

    words.add(prefix + body);
  }

  return [...words];
}

function pickLookupWords(words: string[], sampleSize = LOOKUP_SAMPLE) {
  if (words.length <= sampleSize) return words;
  const step = Math.floor(words.length / sampleSize);
  return Array.from({ length: sampleSize }, (_, i) => words[i * step]);
}

function fillCompact(words: string[], charByteSize: CharByteSize) {
  const trie = new CompactTrie(charByteSize, 1);
  for (const word of words) trie.addWord(word);
  return trie;
}

function fillTeacher(words: string[]) {
  const trie = new Trie();
  for (const word of words) trie.addWord(word);
  return trie;
}

function lookupCompact(trie: CompactTrie, words: string[]) {
  let found = 0;
  for (const word of words) {
    trie.resetCursor();
    for (const char of word) trie.go(char);
    if (trie.isWord()) found++;
  }
  return found;
}

function lookupTeacher(trie: Trie, words: string[]) {
  let found = 0;
  for (const word of words) {
    const chars = [...word];
    let view = trie.go(chars[0]);
    for (let i = 1; i < chars.length; i++) view = view.go(chars[i]);
    if (view.isWord()) found++;
  }
  return found;
}

function collectMemoryRows(): MemoryRow[] {
  const rows: MemoryRow[] = [];

  for (const alphabet of ALPHABETS) {
    const words = generateWords(alphabet);
    const lookupWords = pickLookupWords(words);

    // Trie первым: пока CompactTrie не забивает кучу ArrayBuffer'ами,
    // и предыдущие Trie остаются в retainedLive (не отдают free-list).
    const { value: teacher, bytes: teacherBytes } = measureRetainedBytes(() =>
      fillTeacher(words)
    );
    rows.push({
      alphabetId: alphabet.id,
      impl: 'Trie(Map)',
      charByteSize: null,
      bytesPerNode: null,
      nodeCount: (teacher as Trie).getStats().nodeCount,
      usedBytes: teacherBytes,
      allocBytes: null,
      lookupOk: lookupTeacher(teacher as Trie, lookupWords),
      lookupTotal: lookupWords.length,
      truncated: false,
    });

    const sizes = [
      ...new Set<CharByteSize>(
        [
          alphabet.minCharByteSize,
          // соседние ширины для сравнения, без truncate ниже минимума
          ...(alphabet.minCharByteSize > 1
            ? [(alphabet.minCharByteSize - 1) as CharByteSize]
            : []),
          Math.min(4, (alphabet.minCharByteSize + 1) as CharByteSize),
          2,
          4,
        ].filter((size) => size >= alphabet.minCharByteSize)
      ),
    ].sort((a, b) => a - b);

    for (const charByteSize of sizes) {
      const trie = fillCompact(words, charByteSize);
      const stats = trie.getStats();
      rows.push({
        alphabetId: alphabet.id,
        impl: 'CompactTrie',
        charByteSize,
        bytesPerNode: stats.bytesPerNode,
        nodeCount: stats.nodeCount,
        usedBytes: stats.usedBytes,
        allocBytes: stats.byteLength,
        lookupOk: lookupCompact(trie, lookupWords),
        lookupTotal: lookupWords.length,
        truncated: charByteSize < alphabet.minCharByteSize,
      });
    }
  }

  // Не даём DCE выкинуть retainedLive до конца сбора
  blackhole = retainedLive.length;

  return rows;
}

function memoryBenchName(row: MemoryRow) {
  if (row.impl === 'CompactTrie') {
    return [
      `${row.alphabetId}`,
      `CompactTrie char=${row.charByteSize}`,
      `${row.bytesPerNode}B/node`,
      `used=${formatBytes(row.usedBytes)}`,
      `nodes=${row.nodeCount}`,
      row.truncated ? 'TRUNCATE' : `ok ${row.lookupOk}/${row.lookupTotal}`,
    ].join(' | ');
  }

  return [
    `${row.alphabetId}`,
    `Trie(Map)`,
    `retained≈${formatBytes(row.usedBytes)}`,
    `nodes=${row.nodeCount}`,
    `ok ${row.lookupOk}/${row.lookupTotal}`,
  ].join(' | ');
}

function printMemoryTable(rows: MemoryRow[]) {
  const lines = [
    '',
    '='.repeat(72),
    `ПАМЯТЬ  (${WORD_COUNT} слов, алфавит по 26 символов)`,
    '='.repeat(72),
  ];

  for (const alphabet of ALPHABETS) {
    const maxCp = maxCodePoint(alphabet.letters + alphabet.prefixes.join(''));
    const alphabetRows = rows.filter((r) => r.alphabetId === alphabet.id);
    const compactMin = alphabetRows.find(
      (r) =>
        r.impl === 'CompactTrie' && r.charByteSize === alphabet.minCharByteSize
    );
    const teacher = alphabetRows.find((r) => r.impl === 'Trie(Map)');

    lines.push(
      '',
      `${alphabet.label} [${alphabet.id}]  max=U+${maxCp
        .toString(16)
        .toUpperCase()}  min charByteSize=${alphabet.minCharByteSize}`
    );

    for (const row of alphabetRows.sort((a, b) => {
      if (a.impl === b.impl) {
        return (a.charByteSize ?? 0) - (b.charByteSize ?? 0);
      }
      return a.impl === 'CompactTrie' ? -1 : 1;
    })) {
      lines.push(`  ${memoryBenchName(row)}`);
    }

    if (compactMin && teacher) {
      const ratio = teacher.usedBytes / Math.max(compactMin.usedBytes, 1);
      lines.push(
        `  → сравнение: Trie(Map) retained / CompactTrie(char=${alphabet.minCharByteSize}) used ≈ ×${ratio.toFixed(1)}`
      );
    }
  }

  lines.push(
    '',
    'Сводка: CompactTrie used vs Trie retained (min charByteSize)',
    '-'.repeat(72)
  );

  for (const alphabet of ALPHABETS) {
    const compactMin = rows.find(
      (r) =>
        r.alphabetId === alphabet.id &&
        r.impl === 'CompactTrie' &&
        r.charByteSize === alphabet.minCharByteSize
    );
    const teacher = rows.find(
      (r) => r.alphabetId === alphabet.id && r.impl === 'Trie(Map)'
    );
    if (!compactMin || !teacher) continue;

    const ratio = teacher.usedBytes / Math.max(compactMin.usedBytes, 1);
    lines.push(
      `  ${alphabet.label.padEnd(12)} CompactTrie ${formatBytes(compactMin.usedBytes).padStart(10)}  |  Trie(Map) ${formatBytes(teacher.usedBytes).padStart(10)}  |  ×${ratio.toFixed(1)}`
    );
  }

  lines.push('', '='.repeat(72), '');
  process.stdout.write(lines.join('\n') + '\n');
}

const MEMORY_ROWS = collectMemoryRows();
printMemoryTable(MEMORY_ROWS);

describe('память: usedBytes / nodes (цифры в названии; hz здесь не важен)', () => {
  for (const row of MEMORY_ROWS) {
    bench(
      memoryBenchName(row),
      () => {
        blackhole = row.usedBytes;
      },
      { time: 50, warmupTime: 0, warmupIterations: 0, iterations: 1 }
    );
  }
});

describe('lookup: CompactTrie vs Trie', () => {
  for (const alphabet of ALPHABETS) {
    const words = generateWords(alphabet);
    const lookupWords = pickLookupWords(words);
    const charByteSize = alphabet.minCharByteSize;
    const compact = fillCompact(words, charByteSize);
    const teacher = fillTeacher(words);

    bench(`${alphabet.id} CompactTrie char=${charByteSize}`, () => {
      blackhole = lookupCompact(compact, lookupWords);
    });

    bench(`${alphabet.id} Trie (Map)`, () => {
      blackhole = lookupTeacher(teacher, lookupWords);
    });
  }
});
