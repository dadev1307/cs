import * as zlib from 'node:zlib';
import { bench, describe } from 'vitest';
import { Matrix2D, RGBA, RGBAView, type TupleRGBA } from './index.ts';

const WIDTH = 256;
const HEIGHT = 256;
const PIXELS = WIDTH * HEIGHT;

function fillPattern(x: number, y: number): TupleRGBA {
  return [(x * 7) & 0xff, (y * 11) & 0xff, ((x + y) * 3) & 0xff, 255];
}

const matrix = new Matrix2D<TupleRGBA | string, TupleRGBA, RGBAView>(
  WIDTH,
  HEIGHT,
  RGBA
);

const flatArray: number[] = new Array(PIXELS * 4);
const nestedArray: TupleRGBA[][] = new Array(HEIGHT);

for (let y = 0; y < HEIGHT; y++) {
  nestedArray[y] = new Array(WIDTH);
  for (let x = 0; x < WIDTH; x++) {
    const pixel = fillPattern(x, y);
    matrix.set(x, y, pixel);
    const baseIndex = (y * WIDTH + x) * 4;
    flatArray[baseIndex] = pixel[0];
    flatArray[baseIndex + 1] = pixel[1];
    flatArray[baseIndex + 2] = pixel[2];
    flatArray[baseIndex + 3] = pixel[3];
    nestedArray[y][x] = pixel;
  }
}

const matrixBytes = matrix.bytes;
const flatJsonString = JSON.stringify(flatArray);
const nestedJsonString = JSON.stringify(nestedArray);
const flatJsonBuffer = Buffer.from(flatJsonString);
const nestedJsonBuffer = Buffer.from(nestedJsonString);

const matrixGzip = zlib.gzipSync(matrixBytes);
const flatGzip = zlib.gzipSync(flatJsonBuffer);
const nestedGzip = zlib.gzipSync(nestedJsonBuffer);

const matrixBrotli = zlib.brotliCompressSync(matrixBytes);
const flatBrotli = zlib.brotliCompressSync(flatJsonBuffer);
const nestedBrotli = zlib.brotliCompressSync(nestedJsonBuffer);

console.log('\n=== Размер на диске (256×256 RGBA, %d пикселей) ===', PIXELS);
console.table({
  'Matrix2D (Uint8Array)': {
    raw: matrixBytes.byteLength,
    gzip: matrixGzip.length,
    brotli: matrixBrotli.length,
  },
  'JSON flat array': {
    raw: flatJsonBuffer.length,
    gzip: flatGzip.length,
    brotli: flatBrotli.length,
  },
  'JSON nested array': {
    raw: nestedJsonBuffer.length,
    gzip: nestedGzip.length,
    brotli: nestedBrotli.length,
  },
});

describe('Matrix 256×256: сериализация (структура → байты для отправки/записи)', () => {
  bench('Matrix2D → matrix.bytes (отдать ссылку, как fs.writeFileSync / socket.write)', () => {
    const ref = matrix.bytes;
    return ref;
  });

  bench('Matrix2D → Buffer.from(bytes) (полная копия — независимый снимок)', () => {
    Buffer.from(matrixBytes);
  });

  bench('flat number[] → JSON.stringify', () => {
    JSON.stringify(flatArray);
  });

  bench('nested TupleRGBA[][] → JSON.stringify', () => {
    JSON.stringify(nestedArray);
  });
});

describe('Matrix 256×256: десериализация (байты → пригодная к доступу структура)', () => {
  bench('Matrix2D из существующего Uint8Array', () => {
    new Matrix2D<TupleRGBA | string, TupleRGBA, RGBAView>(
      WIDTH,
      HEIGHT,
      RGBA,
      matrixBytes
    );
  });

  bench('JSON.parse flat number[]', () => {
    JSON.parse(flatJsonString);
  });

  bench('JSON.parse nested TupleRGBA[][]', () => {
    JSON.parse(nestedJsonString);
  });
});

describe('Matrix 256×256: сериализация + Brotli (реалистичный сценарий: снимок на диск)', () => {
  bench('Matrix2D bytes → brotli', () => {
    zlib.brotliCompressSync(matrixBytes);
  });

  bench('flat JSON → brotli', () => {
    zlib.brotliCompressSync(Buffer.from(JSON.stringify(flatArray)));
  });

  bench('nested JSON → brotli', () => {
    zlib.brotliCompressSync(Buffer.from(JSON.stringify(nestedArray)));
  });
});
