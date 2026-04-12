import { IndexedStringBuffer } from './index';

function generateStrings(count: number, avgLength: number): string[] {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const result: string[] = [];

  for (let i = 0; i < count; i++) {
    let str = '';
    for (let j = 0; j < avgLength; j++) {
      str += chars[(i * 7 + j * 13) % chars.length];
    }
    result.push(str);
  }

  return result;
}

function generateReplacements(count: number, avgLength: number): string[] {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*';
  const result: string[] = [];

  for (let i = 0; i < count; i++) {
    const len = Math.max(1, avgLength + ((i % 5) - 2) * 3);
    let str = '';
    for (let j = 0; j < len; j++) {
      str += chars[(i * 11 + j * 17) % chars.length];
    }
    result.push(str);
  }

  return result;
}

function measure(name: string, iterations: number, fn: () => void) {
  // warmup
  for (let i = 0; i < 3; i++) fn();

  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }

  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  const avg = times.reduce((s, t) => s + t, 0) / times.length;
  const min = times[0];
  const max = times[times.length - 1];

  console.log(
    `  ${name.padEnd(45)} median: ${median.toFixed(3)}ms  avg: ${avg.toFixed(3)}ms  min: ${min.toFixed(3)}ms  max: ${max.toFixed(3)}ms`
  );

  return median;
}

// --- Малое кол-во строк ---

const SMALL_COUNT = 20;
const SMALL_OPS = 100;
const smallStrings = generateStrings(SMALL_COUNT, 10);
const smallReplacements = generateReplacements(SMALL_OPS, 8);

console.log(`\n=== Small: ${SMALL_COUNT} strings, ${SMALL_OPS} set ops ===\n`);

const smallLazy = measure('alwaysRebuild=false (lazy compaction)', 50, () => {
  const buf = new IndexedStringBuffer(smallStrings, false);
  for (let i = 0; i < SMALL_OPS; i++) {
    buf.set(i % SMALL_COUNT, smallReplacements[i]);
  }
});

const smallRebuild = measure('alwaysRebuild=true  (always rebuild)', 50, () => {
  const buf = new IndexedStringBuffer(smallStrings, true);
  for (let i = 0; i < SMALL_OPS; i++) {
    buf.set(i % SMALL_COUNT, smallReplacements[i]);
  }
});

console.log(
  `\n  -> lazy/rebuild ratio: ${(smallRebuild / smallLazy).toFixed(2)}x`
);

// --- Большое кол-во строк ---

const LARGE_COUNT = 1000;
const LARGE_OPS = 5000;
const largeStrings = generateStrings(LARGE_COUNT, 20);
const largeReplacements = generateReplacements(LARGE_OPS, 15);

console.log(`\n=== Large: ${LARGE_COUNT} strings, ${LARGE_OPS} set ops ===\n`);

const largeLazy = measure('alwaysRebuild=false (lazy compaction)', 20, () => {
  const buf = new IndexedStringBuffer(largeStrings, false);
  for (let i = 0; i < LARGE_OPS; i++) {
    buf.set(i % LARGE_COUNT, largeReplacements[i]);
  }
});

const largeRebuild = measure('alwaysRebuild=true  (always rebuild)', 20, () => {
  const buf = new IndexedStringBuffer(largeStrings, true);
  for (let i = 0; i < LARGE_OPS; i++) {
    buf.set(i % LARGE_COUNT, largeReplacements[i]);
  }
});

console.log(
  `\n  -> lazy/rebuild ratio: ${(largeRebuild / largeLazy).toFixed(2)}x`
);

// --- Влияние COMPACTION_THRESHOLD ---

const THRESHOLDS = [50, 100, 500, 2000, 10000] as const;

console.log(
  `\n=== COMPACTION_THRESHOLD impact (${LARGE_COUNT} strings, ${LARGE_OPS} ops) ===\n`
);

for (const threshold of THRESHOLDS) {
  IndexedStringBuffer.COMPACTION_THRESHOLD = threshold;

  measure(`threshold=${String(threshold).padEnd(6)}`, 20, () => {
    const buf = new IndexedStringBuffer(largeStrings, false);
    for (let i = 0; i < LARGE_OPS; i++) {
      buf.set(i % LARGE_COUNT, largeReplacements[i]);
    }
  });
}

IndexedStringBuffer.COMPACTION_THRESHOLD = 100;
