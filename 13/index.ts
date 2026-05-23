function jenkinsHash(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash += key.charCodeAt(i);
    hash += hash << 10;
    hash ^= hash >>> 6;
  }
  hash += hash << 3;
  hash ^= hash >>> 11;
  hash += hash << 15;
  return hash >>> 0;
}

class HashMapEntry {
  lruNext: HashMapEntry | null = null;
  lruPrev: HashMapEntry | null = null;
  collisionNext: HashMapEntry | null = null;

  constructor(
    public key: any,
    public value: any
  ) {
    this.lruNext = null;
    this.lruPrev = null;
  }
}

class HashMap {
  private nextObjectId = 0;
  private buckets: Array<HashMapEntry | null> = [];
  private lruHead: HashMapEntry | null = null;
  private lruTail: HashMapEntry | null = null;

  public size = 0;

  constructor(public capacity: number) {
    this.buckets = new Array(capacity).fill(null);
  }

  private getBucketIndex(key: any) {
    const bucketIndex = (() => {
      if (typeof key !== 'object' || key === null) {
        return jenkinsHash(String(key)) % this.capacity;
      }

      const objectId = key.__objectId;

      if (objectId === undefined) {
        return undefined;
      }

      return jenkinsHash(String(objectId)) % this.capacity;
    })();
    return bucketIndex;
  }

  private rehash() {
    this.capacity = this.capacity * 2;
    const newBuckets = new Array(this.capacity).fill(null);

    let lruEntry = this.lruHead;
    while (lruEntry) {
      const bucketIndex = this.getBucketIndex(lruEntry.key)!;
      newBuckets[bucketIndex] = lruEntry;

      let collisionEntry = lruEntry.collisionNext;
      while (collisionEntry) {
        const collisionBucketIndex = this.getBucketIndex(collisionEntry.key)!;
        newBuckets[collisionBucketIndex] = collisionEntry;
        collisionEntry = collisionEntry.collisionNext;
      }

      lruEntry = lruEntry.lruNext;
    }

    this.buckets = newBuckets;
  }

  private addToLruHead(entry: HashMapEntry) {
    if (!this.lruHead) {
      this.lruHead = entry;
      this.lruTail = entry;
    } else {
      entry.lruNext = this.lruHead;
      this.lruHead.lruPrev = entry;
      this.lruHead = entry;
    }
  }

  get shouldRehash() {
    return this.size / this.capacity > 0.75;
  }

  get(key: any) {
    const bucketIndex = this.getBucketIndex(key);

    if (bucketIndex === undefined) {
      return undefined;
    }

    if (!this.buckets[bucketIndex]) {
      return undefined;
    }

    let collisionEntry: HashMapEntry | null = this.buckets[bucketIndex];

    while (collisionEntry) {
      if (collisionEntry.key === key) {
        return collisionEntry.value;
      }
      collisionEntry = collisionEntry.collisionNext;
    }

    return undefined;
  }

  set(key: any, value: any) {
    if (this.shouldRehash) {
      this.rehash();
    }

    let bucketIndex = this.getBucketIndex(key);

    if (bucketIndex === undefined) {
      bucketIndex = jenkinsHash(String(++this.nextObjectId)) % this.capacity;
      Object.defineProperty(key, '__objectId', {
        value: this.nextObjectId,
        writable: false,
        enumerable: false,
      });
    }

    if (!this.buckets[bucketIndex]) {
      const entry = new HashMapEntry(key, value);
      this.buckets[bucketIndex] = entry;
      this.addToLruHead(entry);
      this.size++;
    } else {
      let isKeyFound = false;
      let collisionEntry = this.buckets[bucketIndex];
      while (collisionEntry) {
        if (collisionEntry.key === key) {
          collisionEntry.value = value;
          isKeyFound = true;
          return this;
        }
        collisionEntry = collisionEntry.lruNext;
      }

      if (!isKeyFound) {
        let collisionChainTail = this.buckets[bucketIndex]!;

        while (collisionChainTail && collisionChainTail.collisionNext) {
          collisionChainTail = collisionChainTail.collisionNext;
        }

        const entry = new HashMapEntry(key, value);
        collisionChainTail.collisionNext = entry;
        this.addToLruHead(entry);
        this.size++;
      }
    }
  }

  private removeFromLruList(entry: HashMapEntry) {
    if (!entry.lruPrev) {
      this.lruHead = entry.lruNext;
    } else {
      entry.lruPrev.lruNext = entry.lruNext;
    }

    if (!entry.lruNext) {
      this.lruTail = entry.lruPrev;
    } else {
      entry.lruNext.lruPrev = entry.lruPrev;
    }
  }

  delete(key: any) {
    const bucketIndex = this.getBucketIndex(key);

    if (bucketIndex === undefined) {
      return false;
    }

    if (!this.buckets[bucketIndex]) {
      return false;
    }

    let collisionEntry: HashMapEntry | null = this.buckets[bucketIndex];

    while (collisionEntry) {
      if (collisionEntry.key === key) {
        this.buckets[bucketIndex] = collisionEntry.collisionNext;
        this.removeFromLruList(collisionEntry);
        this.size--;
        return true;
      }
      collisionEntry = collisionEntry.collisionNext;
    }

    return false;
  }

  *[Symbol.iterator]() {
    let lruEntry = this.lruTail;

    while (lruEntry) {
      yield [lruEntry.key, lruEntry.value];
      lruEntry = lruEntry.lruPrev;
    }
  }
}

const hashMap = new HashMap(2);
const sampleObject = { a: 1, b: 2, c: 3 };
hashMap.set(sampleObject, sampleObject);
hashMap.set(123, sampleObject);
hashMap.set(456, sampleObject);
hashMap.delete(sampleObject);
console.log(hashMap);

for (const [key, value] of hashMap) {
  console.log(key, value);
}
