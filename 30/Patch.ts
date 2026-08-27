class Option<T> {
  static None = new Option<never>(false);
  static Some<T>(value: T): Option<T> {
    return new Option(true, value);
  }

  constructor(
    private some: boolean,
    private value?: T
  ) {}

  isNone() {
    return !this.some;
  }

  flatMap<U>(fn: (value: T) => Option<U>): Option<U> {
    return this.isNone() ? Option.None : fn(this.value!);
  }

  map<U>(fn: (value: T) => U): Option<U> {
    return this.isNone() ? Option.None : Option.Some(fn(this.value!));
  }

  get() {
    return this.value;
  }
}

type Applicative<T, U> = Option<(state: T) => U>;

function isFn<T, U>(value: T | ((state: T) => U)): value is (state: T) => U {
  return typeof value === 'function';
}

class Patch<T> {
  constructor(private state: Option<T>) {}

  static of<T>(value: T) {
    return new Patch(
      isFn(value) ? Option.Some(value) : Option.Some(structuredClone(value))
    );
  }

  map<U>(fn: (value: T) => U) {
    return new Patch(this.state.map(fn));
  }

  apply() {
    return this.state.get();
  }

  ap<U>(value: Patch<U>) {
    //return new Patch()
  }
}

const state = { likes: 10, tag: null };

// Функтор
const p1 = Patch.of(state).map((s) => ({ ...s, likes: s.likes + 1 }));

console.log(p1.apply()); // { likes: 11, tag: null }
console.log(state); // { likes: 10, tag: null } — не изменился

// Аппликатив
const add = Patch.of((n: number) => n + 1);
console.log(add.ap(Patch.of(10)).apply()); // 11

// Монада
const p2 = Patch.of(state)
  .map((s) => ({ ...s, likes: s.likes + 1 }))
  .flatMap((s) =>
    s.likes > 10 ? Patch.of({ ...s, tag: 'hot' }) : Patch.of(s)
  );

console.log(p2.apply()); // { likes: 11, tag: "hot" }
