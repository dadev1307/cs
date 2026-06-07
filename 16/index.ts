class Node<T, U> {
  key: T;
  value: U;
  left?: Node<T, U>;
  right?: Node<T, U>;

  constructor(key: T, value: U) {
    this.key = key;
    this.value = value;
  }
}

class TreeMap<T, U> {
  private root: Node<T, U> | null = null;

  private insert(node: Node<T, U>) {
    if (this.root === null) {
      this.root = node;
      return this;
    }

    let current = this.root;

    while (current) {
      if (node.key === current.key) {
        current.value = node.value;
        return this;
      }

      if (node.key < current.key && current.left) {
        current = current.left;
        continue;
      }

      if (node.key > current.key && current.right) {
        current = current.right;
        continue;
      }

      if (node.key < current.key) {
        current.left = node;
        return this;
      }

      if (node.key > current.key) {
        current.right = node;
        return this;
      }
    }

    console.error('Не предвиденная ситуация, разраб что-то упустил');
    return this;
  }

  private find(key: T) {
    if (!this.root) {
      return null;
    }

    let current = this.root;

    while (current) {
      if (current.key === key) {
        return current;
      }

      if (key < current.key && current.left) {
        current = current.left;
        continue;
      }

      if (key > current.key && current.right) {
        current = current.right;
        continue;
      }

      return null;
    }
  }

  public set(key: T, value: U) {
    const node = new Node(key, value);

    return this.insert(node);
  }

  public get(key: T) {
    const node = this.find(key);
    if (!node) {
      return undefined;
    }

    return node.value;
  }

  public has(key: T) {
    return Boolean(this.find(key));
  }

  private extractNodeData(
    node: Node<T, U>,
    type: 'key' | 'value' | 'entries'
  ): T | U | [T, U] {
    if (type === 'key') {
      return node.key;
    }

    if (type === 'value') {
      return node.value;
    }

    return [node.key, node.value];
  }

  private inOrderTraversal(type: 'key'): T[];
  private inOrderTraversal(type: 'value'): U[];
  private inOrderTraversal(type: 'entries'): Array<[T, U]>;
  private inOrderTraversal(type: 'key' | 'value' | 'entries') {
    if (!this.root) {
      return [];
    }

    const result = [];
    const stack: Node<T, U>[] = [];
    let current: Node<T, U> | undefined = this.root;

    while (current || stack.length) {
      while (current) {
        stack.push(current);
        current = current.left;
      }

      current = stack.pop();
      result.push(this.extractNodeData(current!, type));
      current = current!.right;
    }

    return result;
  }

  public keys() {
    return this.inOrderTraversal('key');
  }

  public values() {
    return this.inOrderTraversal('value');
  }

  public entries() {
    return this.inOrderTraversal('entries');
  }

  private getLeftmostNode(node: Node<T, U>) {
    let currentNode = node;
    while (currentNode.left) {
      currentNode = currentNode.left;
    }
    return currentNode;
  }

  public delete(key: T) {
    if (!this.root) {
      return false;
    }

    let current = this.root;
    let parent: Node<T, U> | null = null;

    while (current) {
      if (current.key === key) {
        if (!current.left && !current.right) {
          parent!.left = undefined;
          return true;
        }

        if (current.left && !current.right) {
          parent!.left = current.left;
          return true;
        }

        if (!current.left && current.right) {
          parent!.right = current.right;
          return true;
        }

        const leftmostNode = this.getLeftmostNode(current.right!);

        this.delete(leftmostNode.key);

        current.key = leftmostNode.key;
        current.value = leftmostNode.value;
      }

      if (key < current.key && current.left) {
        parent = current;
        current = current.left;
        continue;
      }

      if (key > current.key && current.right) {
        parent = current;
        current = current.right;
        continue;
      }

      return false;
    }
  }
}

const map = new TreeMap();

map.set('banana', 3);
map.set('apple', 2);
map.set('cherry', 5);
map.set('date', 1);

console.log(map.get('apple')); // 2
console.log(map.has('banana')); // true
console.log(map.keys()); // ["apple", "banana", "cherry", "date"]

map.delete('banana');
console.log(map.entries());

// Ассоциативный массив на бинарном дереве в плоском массиве

class ArrayTreeMap<T, U> {
  private tree: Array<[T, U] | null> = [];

  constructor(capacity: number) {
    this.tree = new Array(capacity).fill(null);
  }

  private getLeftIndex(level: number) {
    return 2 * level + 1;
  }

  private getRightIndex(level: number) {
    return 2 * level + 2;
  }

  public set(key: T, value: U) {
    if (!this.tree[0]) {
      this.tree[0] = [key, value];
      return this;
    }

    let level = 0;
    let current: [T, U] | null = this.tree[0];

    while (current) {
      const [currentKey] = current;

      if (key === currentKey) {
        current[1] = value;
        return this;
      }

      const leftIndex = this.getLeftIndex(level);
      const isLeftValue = this.tree[leftIndex] !== null;

      if (key < currentKey && isLeftValue) {
        current = this.tree[leftIndex];
        level = leftIndex;
        continue;
      }

      const rightIndex = this.getRightIndex(level);
      const isRightValue = this.tree[rightIndex] !== null;

      if (key > currentKey && isRightValue) {
        current = this.tree[rightIndex];
        level = rightIndex;
        continue;
      }

      if (key < currentKey) {
        this.tree[leftIndex] = [key, value];
        return this;
      }

      if (key > currentKey) {
        this.tree[rightIndex] = [key, value];
        return this;
      }
    }
  }

  private find(key: T) {
    if (!this.tree[0]) {
      return { index: -1, node: undefined };
    }

    let current: [T, U] | null = this.tree[0];
    let index = 0;
    while (current) {
      const [currentKey] = current;
      if (key === currentKey) {
        return { index, node: current };
      }

      const leftIndex = this.getLeftIndex(index);
      const leftNode = this.tree[index];

      if (key < currentKey && leftNode) {
        current = this.tree[leftIndex];
        index = leftIndex;
        continue;
      }

      const rightIndex = this.getRightIndex(index);
      const rightNode = this.tree[rightIndex];

      if (key > currentKey && rightNode) {
        current = this.tree[rightIndex];
        index = rightIndex;
        continue;
      }

      return { index: -1, node: undefined };
    }

    return { index: -1, node: undefined };
  }

  public get(key: T) {
    const { node } = this.find(key);
    if (!node) {
      return undefined;
    }

    return node[1];
  }

  public has(key: T) {
    return Boolean(this.find(key));
  }

  private extractNodeData(node: [T, U], type: 'key' | 'value' | 'entries') {
    if (type === 'key') {
      return node[0];
    }

    if (type === 'value') {
      return node[1];
    }

    return node;
  }

  private inOrderTraversal(type: 'key'): T[];
  private inOrderTraversal(type: 'value'): U[];
  private inOrderTraversal(type: 'entries'): Array<[T, U]>;
  private inOrderTraversal(type: 'key' | 'value' | 'entries') {
    if (!this.tree[0]) {
      return [];
    }

    const result: (T | U | [T, U])[] = [];
    const stack: Array<{ node: [T, U]; index: number }> = [];
    let index = 0;
    let current: [T, U] | null = this.tree[0];

    while (current || stack.length) {
      while (current) {
        stack.push({ node: current, index });
        index = this.getLeftIndex(index);
        current = this.tree[index];
      }
      const frame = stack.pop()!;
      result.push(this.extractNodeData(frame.node, type));
      index = this.getRightIndex(frame.index);
      current = this.tree[index];
    }

    return result;
  }

  public keys() {
    return this.inOrderTraversal('key');
  }

  public values() {
    return this.inOrderTraversal('value');
  }

  public entries() {
    return this.inOrderTraversal('entries');
  }

  public getIndex(key: T) {
    return this.find(key).index;
  }

  private getLeftmostNode(index: number) {
    let node = this.tree[index];
    let currentIndex = index;
    let leftIndex = this.getLeftIndex(currentIndex);
    let leftNode = this.tree[leftIndex];

    while (leftNode) {
      node = leftNode;
      currentIndex = leftIndex;
      leftIndex = this.getLeftIndex(currentIndex);
      leftNode = this.tree[leftIndex];
    }

    return { node: node!, index: currentIndex };
  }

  public delete(key: T): boolean {
    const { index, node } = this.find(key);
    if (!node) {
      return false;
    }

    let curentNode = node;
    let currentIndex = index;

    while (curentNode) {
      const [currentKey] = curentNode;

      const leftIndex = this.getLeftIndex(currentIndex);
      const leftNode = this.tree[leftIndex];

      if (key < currentKey && leftNode) {
        curentNode = leftNode;
        currentIndex = leftIndex;
        continue;
      }

      const rightIndex = this.getRightIndex(currentIndex);
      const rightNode = this.tree[rightIndex];

      if (key > currentKey && rightNode) {
        curentNode = rightNode;
        currentIndex = rightIndex;
        continue;
      }

      if (key === currentKey) {
        if (!leftNode && !rightNode) {
          this.tree[currentIndex] = null;
          return true;
        }

        if (leftNode && !rightNode) {
          this.tree[currentIndex] = leftNode;
          return true;
        }

        if (!leftNode && rightNode) {
          this.tree[currentIndex] = rightNode;
          return true;
        }

        const { node: leftmostNode, index: leftmostIndex } =
          this.getLeftmostNode(this.getRightIndex(currentIndex));

        this.tree[leftmostIndex] = null;

        this.delete(leftmostNode[0]);

        curentNode[0] = leftmostNode[0];
        curentNode[1] = leftmostNode[1];

        return true;
      }

      return false;
    }

    return false;
  }
}

const map2 = new ArrayTreeMap(16);

// map2.set(10, 'A');
// map2.set(5, 'B');
// map2.set(15, 'C');
// map2.set(3, 'D');
// map2.set(7, 'E');

// map2.delete(10);

// console.log(map2.entries());

// console.log(map2.get(7)); // "E"
// console.log(map2.getIndex(10)); // -1
// console.log(map2.getIndex(15)); // 0
// console.log(map2.getIndex(7)); // 4
