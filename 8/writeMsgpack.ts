import * as fs from 'node:fs';
import * as path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { PackrStream } from 'msgpackr';
import { parseCSV } from './index.ts';

const csvPath = path.join(import.meta.dirname, 'anime_dataset.csv');
const msgpackPath = path.join(import.meta.dirname, 'anime_dataset.msgpack');

const generator = parseCSV(csvPath, {
  delimiter: ',',
  mode: 'buffer',
  async: true,
  chunkSize: 256_000,
});

if (!generator) {
  throw new Error('parseCSV returned no generator');
}

const packr = new PackrStream();
const writeStream = fs.createWriteStream(msgpackPath);

const source = (async function* () {
  let headers: string[] | null = null;
  let rowIndex = 0;
  for await (const row of generator) {
    if (!headers) {
      headers = row;
      continue;
    }
    const record: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      record[headers[i]] = row[i] ?? '';
    }
    yield record;
    rowIndex++;
    if (rowIndex % 10_000 === 0) {
      console.log(`packed ${rowIndex} rows`);
    }
  }
  console.log(`packed ${rowIndex} rows total`);
})();

await pipeline(source, packr, writeStream);

const origSize = fs.statSync(csvPath).size;
const packedSize = fs.statSync(msgpackPath).size;
const toMb = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);
console.log(`CSV:      ${toMb(origSize)} MB`);
console.log(`MsgPack:  ${toMb(packedSize)} MB`);
console.log(`Ratio:    ${(packedSize / origSize).toFixed(3)}x`);
