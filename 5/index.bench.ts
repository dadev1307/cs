import { bench, describe } from 'vitest';

import {
  PixelStreamArrayOfArrays,
  PixelStreamArrayOfObjects,
  PixelStreamFlatArray,
  PixelStreamUint8Array,
  RGBA,
  TraverseMode,
} from './index.js';

const SIZES = [2048] as const;

const MODES = [TraverseMode.RowMajor, TraverseMode.ColMajor] as const;

const OPAQUE_BLACK: RGBA = [0, 0, 0, 255];

describe('Flat Array', () => {
  for (const size of SIZES) {
    describe(`${size}×${size}`, () => {
      for (const mode of MODES) {
        const stream = new PixelStreamFlatArray(size, size, OPAQUE_BLACK);
        const label = `forEach ${TraverseMode[mode]}`;

        bench(label, () => {
          stream.forEach(mode, () => {});
        });
      }
    });
  }
});

describe('Array of Arrays', () => {
  for (const size of SIZES) {
    describe(`${size}×${size}`, () => {
      for (const mode of MODES) {
        const stream = new PixelStreamArrayOfArrays(size, size, OPAQUE_BLACK);
        const label = `forEach ${TraverseMode[mode]}`;

        bench(label, () => {
          stream.forEach(mode, () => {});
        });
      }
    });
  }
});

describe('Array of Objects', () => {
  for (const size of SIZES) {
    describe(`${size}×${size}`, () => {
      for (const mode of MODES) {
        const stream = new PixelStreamArrayOfObjects(size, size, OPAQUE_BLACK);
        const label = `forEach ${TraverseMode[mode]}`;

        bench(label, () => {
          stream.forEach(mode, () => {});
        });
      }
    });
  }
});

describe('Uint8Array', () => {
  for (const size of SIZES) {
    describe(`${size}×${size}`, () => {
      for (const mode of MODES) {
        const stream = new PixelStreamUint8Array(size, size, OPAQUE_BLACK);
        const label = `forEach ${TraverseMode[mode]}`;

        bench(label, () => {
          stream.forEach(mode, () => {});
        });
      }
    });
  }
});

describe('Uint8ClampedArray', () => {
  for (const size of SIZES) {
    describe(`${size}×${size}`, () => {
      for (const mode of MODES) {
        const stream = new PixelStreamUint8Array(size, size, OPAQUE_BLACK);
        const label = `forEach ${TraverseMode[mode]}`;

        bench(label, () => {
          stream.forEach(mode, () => {});
        });
      }
    });
  }
});
