import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { UnpackrStream } from 'msgpackr';

function parseCSVBuffer(
  buffer: Uint8Array,
  config: { delimiter: string } = { delimiter: ',' }
) {
  const decoder = new TextDecoder();
  const CR_CODE = '\r'.charCodeAt(0);
  const LF_CODE = '\n'.charCodeAt(0);
  const DOUBLE_QUOTE_CODE = '"'.charCodeAt(0);
  const DELIMITER_CODE = config.delimiter.charCodeAt(0);

  const rows: string[][] = [];

  let isInsideQuotes = false;
  let currentRow = [];
  for (
    let i = 0, cellStart = 0, colIndex = 0, wasCellQuoted = false;
    i < buffer.length;
    i++
  ) {
    const code = buffer[i];

    if (code === DOUBLE_QUOTE_CODE) {
      isInsideQuotes = !isInsideQuotes;
      wasCellQuoted = true;

      while (isInsideQuotes && i < buffer.length) {
        i++;
        const code = buffer[i];
        const nextCode = buffer[i + 1];

        if (code === DOUBLE_QUOTE_CODE && nextCode === DOUBLE_QUOTE_CODE) {
          i++;
          continue;
        }

        if (code === DOUBLE_QUOTE_CODE) {
          isInsideQuotes = !isInsideQuotes;
          break;
        }
      }

      continue;
    }

    const isSaveCell =
      (code === DELIMITER_CODE || code === LF_CODE || code === CR_CODE) &&
      !isInsideQuotes;

    const isSaveRow = (code === LF_CODE || code === CR_CODE) && !isInsideQuotes;

    if (isSaveCell) {
      const contentStart = wasCellQuoted ? cellStart + 1 : cellStart;
      const contentEnd = wasCellQuoted ? i - 1 : i;
      const cellValue = decoder.decode(
        buffer.subarray(contentStart, contentEnd)
      );
      currentRow[colIndex++] = cellValue;
      cellStart = i + 1;
      wasCellQuoted = false;
    }

    if (isSaveRow) {
      rows.push(currentRow);
      currentRow = [];
      colIndex = 0;

      if (code === CR_CODE) {
        cellStart++;
        i++;
      }
    }
  }

  return rows;
}

function parseCSVString(
  stringBuffer: string,
  config: { delimiter: string } = { delimiter: ',' }
) {
  const CR = '\r';
  const LF = '\n';
  const DOUBLE_QUOTE = '"';
  const DELIMITER = config.delimiter;

  const rows: string[][] = [];

  let isInsideQuotes = false;
  let currentRow = [];
  for (
    let i = 0, cellStart = 0, colIndex = 0, wasCellQuoted = false;
    i < stringBuffer.length;
    i++
  ) {
    const string = stringBuffer[i];

    if (string === DOUBLE_QUOTE) {
      isInsideQuotes = !isInsideQuotes;
      wasCellQuoted = true;

      while (isInsideQuotes && i < stringBuffer.length) {
        i++;
        const string = stringBuffer[i];
        const nextString = stringBuffer[i + 1];

        if (string === DOUBLE_QUOTE && nextString === DOUBLE_QUOTE) {
          i++;
          continue;
        }

        if (string === DOUBLE_QUOTE) {
          isInsideQuotes = !isInsideQuotes;
          break;
        }
      }

      continue;
    }

    const isSaveCell =
      (string === DELIMITER || string === LF || string === CR) &&
      !isInsideQuotes;

    const isSaveRow = (string === LF || string === CR) && !isInsideQuotes;

    if (isSaveCell) {
      const contentStart = wasCellQuoted ? cellStart + 1 : cellStart;
      const contentEnd = wasCellQuoted ? i - 1 : i;
      const cellValue = stringBuffer.slice(contentStart, contentEnd);
      currentRow[colIndex++] = cellValue;
      cellStart = i + 1;
      wasCellQuoted = false;
    }

    if (isSaveRow) {
      rows.push(currentRow);
      currentRow = [];
      colIndex = 0;

      if (string === CR) {
        cellStart++;
        i++;
      }
    }
  }

  return rows;
}

async function* parseCSVBufferStream(
  stream: fs.ReadStream,
  config: { delimiter: string } = { delimiter: ',' }
) {
  const decoder = new TextDecoder();
  const CR_CODE = '\r'.charCodeAt(0);
  const LF_CODE = '\n'.charCodeAt(0);
  const DOUBLE_QUOTE_CODE = '"'.charCodeAt(0);
  const DELIMITER_CODE = config.delimiter.charCodeAt(0);

  let isInsideQuotes = false;
  let wasCellQuoted = false;
  let currentRow = [];
  let tail: Uint8Array | null = null;
  let cellStartIndex = 0;
  let currentIndex = 0;

  for await (const chunk of stream) {
    const chunkBytes = chunk as Uint8Array;
    let buffer: Uint8Array;

    if (tail) {
      buffer = new Uint8Array(tail.byteLength + chunkBytes.length);
      buffer.set(tail);
      buffer.set(chunkBytes, tail.byteLength);

      tail = null;
    } else {
      buffer = new Uint8Array(chunkBytes);
    }

    let lastParsedIndex = 0;

    let isSavedRow = false;

    for (let i = currentIndex; i < buffer.byteLength; i++) {
      const currentCode = buffer[i];

      if (currentCode === DOUBLE_QUOTE_CODE || isInsideQuotes) {
        if (!isInsideQuotes) {
          isInsideQuotes = true;
          wasCellQuoted = true;
          i++;
        }

        while (isInsideQuotes && i < buffer.byteLength) {
          const code = buffer[i];
          const nextCode = buffer[i + 1];

          if (code === DOUBLE_QUOTE_CODE && nextCode === DOUBLE_QUOTE_CODE) {
            i = i + 2;
            continue;
          }

          if (code === DOUBLE_QUOTE_CODE) {
            isInsideQuotes = false;
            i++;
            break;
          }

          i++;
        }

        if (i === buffer.byteLength - 1) {
          currentIndex = 0;
        }
        continue;
      }

      const isSaveCell =
        (currentCode === DELIMITER_CODE ||
          currentCode === LF_CODE ||
          currentCode === CR_CODE) &&
        !isInsideQuotes;

      if (isSaveCell) {
        const contentStart = wasCellQuoted
          ? cellStartIndex + 1
          : cellStartIndex;
        const contentEnd = wasCellQuoted ? i - 1 : i;
        const cellValue = decoder.decode(
          buffer.subarray(contentStart, contentEnd)
        );
        currentRow.push(cellValue);
        cellStartIndex = i + 1;
        wasCellQuoted = false;
      }

      const isSaveRow =
        (currentCode === LF_CODE || currentCode === CR_CODE) && !isInsideQuotes;

      if (isSaveRow) {
        lastParsedIndex = i + 1;
        yield currentRow;
        currentRow = [];
        isSavedRow = true;
        if (currentCode === CR_CODE) {
          i++;
        }
      }
    }

    currentIndex = buffer.byteLength;

    if (lastParsedIndex < buffer.byteLength) {
      tail = buffer.subarray(lastParsedIndex);
      lastParsedIndex = 0;
      currentIndex = tail.byteLength;
      if (isSavedRow) {
        cellStartIndex = 0;
      }
    }
  }
}

export const parseCSV = (
  path: string,
  config:
    | {
        delimiter: string;
        mode: 'buffer' | 'string';
        async: boolean;
        chunkSize: number;
      }
    | undefined = {
    delimiter: ',',
    mode: 'buffer',
    async: false,
    chunkSize: 100,
  }
) => {
  if (config.mode === 'buffer' && !config.async) {
    const csvBuffer = fs.readFileSync(path);
    return parseCSVBuffer(csvBuffer, config);
  }

  if (config.mode === 'string' && !config.async) {
    const csvString = fs.readFileSync(path, 'utf-8');
    return parseCSVString(csvString, config);
  }

  if (config.mode === 'buffer' && config.async) {
    const stream = fs.createReadStream(path, {
      highWaterMark: config.chunkSize,
    });
    return parseCSVBufferStream(stream, config);
  }

  return;
};

export async function* parseMsgpackStream(
  filePath: string,
  config: { chunkSize: number } = { chunkSize: 256_000 }
) {
  const fileStream = fs.createReadStream(filePath, {
    highWaterMark: config.chunkSize,
  });
  const unpackr = new UnpackrStream();
  fileStream.pipe(unpackr);

  for await (const record of unpackr as unknown as AsyncIterable<unknown>) {
    yield record as Record<string, string>;
  }
}

// const csvPath = path.join(import.meta.dirname, 'anime_dataset.csv');
// const originalSize = fs.statSync(csvPath).size;

// function printStats(label: string, compressedPath: string) {
//   const compressedSize = fs.statSync(compressedPath).size;
//   const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
//   console.log(`\n[${label}]`);
//   console.log(`Оригинал:  ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
//   console.log(`Сжатый:    ${(compressedSize / 1024 / 1024).toFixed(2)} MB`);
//   console.log(`Сжатие:    ${ratio}%`);
// }

// const brotliPath = path.join(import.meta.dirname, 'anime_dataset.csv.br');
// await pipeline(
//   fs.createReadStream(csvPath),
//   zlib.createBrotliCompress({
//     params: {
//       [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
//     },
//   }),
//   fs.createWriteStream(brotliPath)
// );
// printStats('Brotli', brotliPath);

// const gzipPath = path.join(import.meta.dirname, 'anime_dataset.csv.gz');
// await pipeline(
//   fs.createReadStream(csvPath),
//   zlib.createGzip({ level: zlib.constants.Z_BEST_COMPRESSION }),
//   fs.createWriteStream(gzipPath)
// );
// printStats('Gzip', gzipPath);
