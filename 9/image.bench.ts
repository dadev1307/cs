import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';
import { bench, describe } from 'vitest';

/** Сырой `image.png` в памяти (как в convertImageToBrotli: чтение завершено до замера). */
const imagePath = path.join(import.meta.dirname, 'image.png');
const rawPng = fs.readFileSync(imagePath);

/** Один раунд сжатия, чтобы в бенче десериализации не вызывать compress каждый раз. */
const brotliBlob = zlib.brotliCompressSync(rawPng);

describe('image.png: скорость сериализации и десериализации (байты PNG ↔ Brotli)', () => {
  bench('сериализация: Brotli-сжатие буфера PNG', () => {
    zlib.brotliCompressSync(rawPng);
  });

  bench('десериализация: Brotli-распаковка в исходные байты', () => {
    zlib.brotliDecompressSync(brotliBlob);
  });
});

describe('image.png: контроль — копия байт без Brotli', () => {
  bench('копия в Uint8Array (как «тупой» снимок в памяти)', () => {
    new Uint8Array(rawPng);
  });
});
