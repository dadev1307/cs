import { bench, describe } from 'vitest';
import { Vector, RGBA, RGBAView, type TupleRGBA } from './index.ts';

const ITEMS = 10_000;

interface RgbaObject {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

const sampleTuple: TupleRGBA = [100, 150, 200, 255];

const prefilledVector = new Vector<TupleRGBA | string, TupleRGBA, RGBAView>(
  0,
  RGBA
);
prefilledVector.reserve(ITEMS);
for (let i = 0; i < ITEMS; i++) {
  prefilledVector.push(sampleTuple);
}

const prefilledArray: RgbaObject[] = new Array(ITEMS);
for (let i = 0; i < ITEMS; i++) {
  prefilledArray[i] = { red: 100, green: 150, blue: 200, alpha: 255 };
}

describe(`push: добавление ${ITEMS} элементов в пустую коллекцию`, () => {
  bench('Vector.push (с reserve, единый Uint8Array)', () => {
    const vector = new Vector<TupleRGBA | string, TupleRGBA, RGBAView>(0, RGBA);
    vector.reserve(ITEMS);
    for (let i = 0; i < ITEMS; i++) {
      vector.push(sampleTuple);
    }
  });

  bench(
    'Array.push объектов {red, green, blue, alpha} (новые объекты на каждой итерации)',
    () => {
      const array: RgbaObject[] = [];
      for (let i = 0; i < ITEMS; i++) {
        array.push({ red: 100, green: 150, blue: 200, alpha: 255 });
      }
    }
  );
});

describe(`get: чтение ${ITEMS} элементов`, () => {
  bench('Vector.get → новый TupleRGBA (allocates)', () => {
    let sink = 0;
    for (let i = 0; i < ITEMS; i++) {
      const tuple = prefilledVector.get(i);
      sink += tuple[0];
    }
    return sink;
  });

  bench('Vector.view().red — поля без аллокации', () => {
    let sink = 0;
    for (let i = 0; i < ITEMS; i++) {
      const view = prefilledVector.view(i);
      sink += view.red;
    }
    return sink;
  });

  bench('Array объектов: чтение поля .red', () => {
    let sink = 0;
    for (let i = 0; i < ITEMS; i++) {
      sink += prefilledArray[i].red;
    }
    return sink;
  });
});

describe(`перезапись ${ITEMS} элементов на месте (давление на GC)`, () => {
  bench(
    'Vector.view().red = ... — чистый byte-write, ноль новых объектов',
    () => {
      for (let i = 0; i < ITEMS; i++) {
        const view = prefilledVector.view(i);
        view.red = 200;
        view.green = 100;
        view.blue = 50;
        view.alpha = 255;
      }
    }
  );

  bench('Array: мутация полей существующих объектов', () => {
    for (let i = 0; i < ITEMS; i++) {
      const obj = prefilledArray[i];
      obj.red = 200;
      obj.green = 100;
      obj.blue = 50;
      obj.alpha = 255;
    }
  });

  bench('Array: замена объектов новыми (имитация GC-нагрузки)', () => {
    for (let i = 0; i < ITEMS; i++) {
      prefilledArray[i] = { red: 200, green: 100, blue: 50, alpha: 255 };
    }
  });
});

describe(`массовые записи: ${ITEMS} push в цикле без reserve (стресс на realloc)`, () => {
  bench(
    'Vector.push без reserve (вынужден реаллоцировать heap+capacity)',
    () => {
      const vector = new Vector<TupleRGBA | string, TupleRGBA, RGBAView>(
        1,
        RGBA
      );
      for (let i = 0; i < ITEMS; i++) {
        vector.push(sampleTuple);
      }
    }
  );

  bench('Array.push без предразмера (V8 сам растит внутренний массив)', () => {
    const array: RgbaObject[] = [];
    for (let i = 0; i < ITEMS; i++) {
      array.push({ red: 100, green: 150, blue: 200, alpha: 255 });
    }
  });
});
