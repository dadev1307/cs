import * as path from 'node:path';
import { bench, describe } from 'vitest';
import { parseCSV, parseMsgpackStream } from './index.ts';

const csvPath = path.join(import.meta.dirname, 'anime_dataset.csv');
const msgpackPath = path.join(import.meta.dirname, 'anime_dataset.msgpack');

describe('stream parsing: CSV vs MessagePack', () => {
  bench('CSV stream, chunk 64 KB', async () => {
    const generator = parseCSV(csvPath, {
      mode: 'buffer',
      delimiter: ',',
      async: true,
      chunkSize: 64_000,
    });
    for await (const _row of generator!) {
    }
  });

  bench('CSV stream, chunk 256 KB', async () => {
    const generator = parseCSV(csvPath, {
      mode: 'buffer',
      delimiter: ',',
      async: true,
      chunkSize: 256_000,
    });
    for await (const _row of generator!) {
    }
  });

  bench('MsgPack stream, chunk 64 KB', async () => {
    for await (const _row of parseMsgpackStream(msgpackPath, {
      chunkSize: 64_000,
    })) {
    }
  });

  bench('MsgPack stream, chunk 256 KB', async () => {
    for await (const _row of parseMsgpackStream(msgpackPath, {
      chunkSize: 256_000,
    })) {
    }
  });
});
