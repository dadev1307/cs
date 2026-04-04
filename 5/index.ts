export type RGBA = [red: number, green: number, blue: number, alpha: number];

export enum TraverseMode {
  RowMajor,
  ColMajor,
}

interface PixelStream {
  getPixel(x: number, y: number): RGBA;
  setPixel(x: number, y: number, rgba: RGBA): boolean;
  forEach(
    mode: TraverseMode,
    callback: (rgba: RGBA, x: number, y: number) => void
  ): void;
}

const OPAQUE_BLACK: RGBA = [0, 0, 0, 255];

function assertInBounds(
  x: number,
  y: number,
  width: number,
  height: number
): void {
  if (x < 0 || x >= width || y < 0 || y >= height) {
    throw new RangeError(`(${x}, ${y}) вне границ ${width}×${height}`);
  }
}

export class PixelStreamFlatArray implements PixelStream {
  private readonly data: number[];
  private readonly width: number;
  private readonly height: number;

  constructor(width: number, height: number, fill: RGBA = OPAQUE_BLACK) {
    this.width = width;
    this.height = height;
    this.data = Array.from({ length: width * height * 4 }, (_, index) => {
      return fill[index % 4];
    });
  }

  private getStartIndex(x: number, y: number): number {
    return y * this.width * 4 + x * 4;
  }

  getPixel(x: number, y: number): RGBA {
    assertInBounds(x, y, this.width, this.height);

    const startIndex = this.getStartIndex(x, y);
    return [
      this.data[startIndex],
      this.data[startIndex + 1],
      this.data[startIndex + 2],
      this.data[startIndex + 3],
    ];
  }

  setPixel(x: number, y: number, rgba: RGBA): boolean {
    assertInBounds(x, y, this.width, this.height);
    const startIndex = this.getStartIndex(x, y);
    this.data[startIndex] = rgba[0];
    this.data[startIndex + 1] = rgba[1];
    this.data[startIndex + 2] = rgba[2];
    this.data[startIndex + 3] = rgba[3];
    return true;
  }

  forEach(
    mode: TraverseMode,
    callback: (rgba: RGBA, x: number, y: number) => void
  ): void {
    if (mode === TraverseMode.RowMajor) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const rgba = this.getPixel(x, y);
          callback(rgba, x, y);
        }
      }

      return;
    }

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const rgba = this.getPixel(x, y);
        callback(rgba, x, y);
      }
    }
  }
}

export class PixelStreamArrayOfArrays implements PixelStream {
  private readonly data: [number, number, number, number][];
  private readonly width: number;
  private readonly height: number;

  constructor(width: number, height: number, fill: RGBA = OPAQUE_BLACK) {
    this.width = width;
    this.height = height;
    this.data = Array.from({ length: width * height }, () => {
      return [fill[0], fill[1], fill[2], fill[3]];
    });
  }

  private getStartIndex(x: number, y: number): number {
    return y * this.width + x;
  }

  getPixel(x: number, y: number): RGBA {
    assertInBounds(x, y, this.width, this.height);

    const startIndex = this.getStartIndex(x, y);
    return this.data[startIndex];
  }

  setPixel(x: number, y: number, rgba: RGBA): boolean {
    assertInBounds(x, y, this.width, this.height);
    const startIndex = this.getStartIndex(x, y);
    this.data[startIndex] = rgba;
    return true;
  }

  forEach(
    mode: TraverseMode,
    callback: (rgba: RGBA, x: number, y: number) => void
  ): void {
    if (mode === TraverseMode.RowMajor) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const rgba = this.getPixel(x, y);
          callback(rgba, x, y);
        }
      }

      return;
    }

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const rgba = this.getPixel(x, y);
        callback(rgba, x, y);
      }
    }
  }
}

export class PixelStreamArrayOfObjects implements PixelStream {
  private readonly data: { r: number; g: number; b: number; a: number }[];
  private readonly width: number;
  private readonly height: number;

  constructor(width: number, height: number, fill: RGBA = OPAQUE_BLACK) {
    this.width = width;
    this.height = height;
    this.data = Array.from({ length: width * height }, () => {
      return { r: fill[0], g: fill[1], b: fill[2], a: fill[3] };
    });
  }

  private getStartIndex(x: number, y: number): number {
    return y * this.width + x;
  }

  getPixel(x: number, y: number): RGBA {
    assertInBounds(x, y, this.width, this.height);

    const startIndex = this.getStartIndex(x, y);
    const { r, g, b, a } = this.data[startIndex];
    return [r, g, b, a];
  }

  setPixel(x: number, y: number, rgba: RGBA): boolean {
    assertInBounds(x, y, this.width, this.height);
    const startIndex = this.getStartIndex(x, y);
    this.data[startIndex] = { r: rgba[0], g: rgba[1], b: rgba[2], a: rgba[3] };
    return true;
  }

  forEach(
    mode: TraverseMode,
    callback: (rgba: RGBA, x: number, y: number) => void
  ): void {
    if (mode === TraverseMode.RowMajor) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const rgba = this.getPixel(x, y);
          callback(rgba, x, y);
        }
      }

      return;
    }

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const rgba = this.getPixel(x, y);
        callback(rgba, x, y);
      }
    }
  }
}

export class PixelStreamUint8Array implements PixelStream {
  private readonly data: Uint8Array;
  private readonly width: number;
  private readonly height: number;

  constructor(width: number, height: number, fill: RGBA = OPAQUE_BLACK) {
    this.width = width;
    this.height = height;
    const buffer = new Uint8Array(width * height * 4).map(
      (_, index) => fill[index % 4]
    );
    this.data = buffer;
  }

  private getStartIndex(x: number, y: number): number {
    return y * this.width * 4 + x * 4;
  }

  getPixel(x: number, y: number): RGBA {
    assertInBounds(x, y, this.width, this.height);

    const startIndex = this.getStartIndex(x, y);
    return [
      this.data[startIndex],
      this.data[startIndex + 1],
      this.data[startIndex + 2],
      this.data[startIndex + 3],
    ];
  }

  setPixel(x: number, y: number, rgba: RGBA): boolean {
    assertInBounds(x, y, this.width, this.height);
    const startIndex = this.getStartIndex(x, y);
    this.data[startIndex] = rgba[0];
    this.data[startIndex + 1] = rgba[1];
    this.data[startIndex + 2] = rgba[2];
    this.data[startIndex + 3] = rgba[3];
    return true;
  }

  forEach(
    mode: TraverseMode,
    callback: (rgba: RGBA, x: number, y: number) => void
  ): void {
    if (mode === TraverseMode.RowMajor) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const rgba = this.getPixel(x, y);
          callback(rgba, x, y);
        }
      }

      return;
    }

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const rgba = this.getPixel(x, y);
        callback(rgba, x, y);
      }
    }
  }
}

export class PixelStreamUint8ClampedArray implements PixelStream {
  private readonly data: Uint8ClampedArray;
  private readonly width: number;
  private readonly height: number;

  constructor(width: number, height: number, fill: RGBA = OPAQUE_BLACK) {
    this.width = width;
    this.height = height;
    const buffer = new Uint8ClampedArray(width * height * 4).map(
      (_, index) => fill[index % 4]
    );
    this.data = buffer;
  }

  private getStartIndex(x: number, y: number): number {
    return y * this.width * 4 + x * 4;
  }

  getPixel(x: number, y: number): RGBA {
    assertInBounds(x, y, this.width, this.height);

    const startIndex = this.getStartIndex(x, y);
    return [
      this.data[startIndex],
      this.data[startIndex + 1],
      this.data[startIndex + 2],
      this.data[startIndex + 3],
    ];
  }

  setPixel(x: number, y: number, rgba: RGBA): boolean {
    assertInBounds(x, y, this.width, this.height);
    const startIndex = this.getStartIndex(x, y);
    this.data[startIndex] = rgba[0];
    this.data[startIndex + 1] = rgba[1];
    this.data[startIndex + 2] = rgba[2];
    this.data[startIndex + 3] = rgba[3];
    return true;
  }

  forEach(
    mode: TraverseMode,
    callback: (rgba: RGBA, x: number, y: number) => void
  ): void {
    if (mode === TraverseMode.RowMajor) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const rgba = this.getPixel(x, y);
          callback(rgba, x, y);
        }
      }

      return;
    }

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const rgba = this.getPixel(x, y);
        callback(rgba, x, y);
      }
    }
  }
}
