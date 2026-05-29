type AnyTypedArray =
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | Float32Array
  | Float64Array;

interface TypedArrayConstructor<T extends AnyTypedArray> {
  new (length: number): T;
}

class Matrix<T extends AnyTypedArray> {
  public data: T;
  public width: number;
  public height: number;

  constructor(
    ArrayClass: TypedArrayConstructor<T>,
    width: number,
    height: number
  ) {
    this.width = width;
    this.height = height;

    this.data = new ArrayClass(width * height);
  }

  get(row: number, col: number): number {
    return this.data[row * this.width + col];
  }

  set(row: number, col: number, value: number): void {
    this.data[row * this.width + col] = value;
  }
}

type Node = {
  id: number;
  weight: number;
  depth: number;
};

class Graph<T extends AnyTypedArray> {
  private matrix: Matrix<T>;

  constructor(matrix: Matrix<T>) {
    this.matrix = matrix;
  }

  hasEdge(u: number, v: number): boolean {
    return this.matrix.get(u, v) > 0 && this.matrix.get(v, u) > 0;
  }

  hasArc(u: number, v: number): boolean {
    return this.matrix.get(u, v) > 0;
  }

  addEdge(u: number, v: number, weight: number = 1): void {
    this.matrix.set(u, v, weight);
    this.matrix.set(v, u, weight);
  }

  removeEdge(u: number, v: number): void {
    this.matrix.set(u, v, 0);
    this.matrix.set(v, u, 0);
  }

  addArc(u: number, v: number, weight: number = 1): void {
    this.matrix.set(u, v, weight);
  }

  removeArc(u: number, v: number): void {
    this.matrix.set(u, v, 0);
  }

  traverse(id: number, callback: (node: Node) => void): void {
    const visited = new Set<number>();

    const queue: Node[] = [{ id, weight: 0, depth: 0 }];

    while (queue.length > 0) {
      const { id, weight, depth } = queue.shift()!;

      if (visited.has(id)) continue;

      visited.add(id);

      callback({ id, weight, depth });

      for (let neighbor = 0; neighbor < this.matrix.width; neighbor++) {
        const edgeWeight = this.matrix.get(id, neighbor);

        if (edgeWeight > 0 && !visited.has(neighbor)) {
          queue.push({ id: neighbor, weight: edgeWeight, depth: depth + 1 });
        }
      }
    }
  }

  getTransitiveClosure(): Matrix<Uint8Array> {
    const closure = new Matrix(
      Uint8Array,
      this.matrix.width,
      this.matrix.height
    );

    for (let i = 0; i < this.matrix.width; i++) {
      for (let j = 0; j < this.matrix.height; j++) {
        if (i === j || this.matrix.get(i, j) > 0) {
          closure.set(i, j, 1);
        }
      }
    }

    for (let k = 0; k < this.matrix.width; k++) {
      for (let i = 0; i < this.matrix.width; i++) {
        for (let j = 0; j < this.matrix.height; j++) {
          if (closure.get(i, k) > 0 && closure.get(k, j) > 0) {
            closure.set(i, j, 1);
          }
        }
      }
    }

    return closure;
  }
}

// const matrix = new Matrix(Uint8Array, 10, 10);

// matrix.set(0, 1, 4);
// matrix.set(1, 2, 7);
// matrix.set(2, 3, 2);
// matrix.set(3, 4, 5);
// matrix.set(4, 0, 9);
// matrix.set(5, 6, 3);
// matrix.set(7, 8, 1);
// matrix.set(9, 2, 8);

// for (let i = 0; i < 10; i++) {
//   for (let j = i + 1; j < 10; j++) {
//     if ((i + j) % 4 === 0) {
//       matrix.set(i, j, i + j);
//       matrix.set(j, i, i + j);
//     }
//   }
// }

// const graph = new Graph(matrix);
// console.log(graph.hasEdge(0, 1));
// console.log(graph.hasArc(0, 1));
// graph.addEdge(1, 0, 10);
// console.log(graph.hasEdge(0, 1));
// graph.removeEdge(0, 1);
// console.log(graph.hasEdge(0, 1));

// graph.traverse(1, (node) => {
//   console.log(
//     `Узел: ${node.id}, глубина: ${node.depth}, вес ребра: ${node.weight}`
//   );
// });

// const closure = graph.getTransitiveClosure();

// console.log(closure);
