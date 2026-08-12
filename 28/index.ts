class Result<T> {
  #state: { ok: true; value: T } | { ok: false; error: unknown };

  constructor(compute: () => T) {
    try {
      this.#state = { ok: true, value: compute() };
    } catch (error) {
      this.#state = { ok: false, error };
    }
  }

  then<U>(onSuccess: (value: T) => U): Result<U> {
    return new Result(() => {
      if (this.#state.ok) {
        return onSuccess(this.#state.value);
      }

      throw this.#state.error;
    });
  }

  catch<U>(onError: (error: unknown) => U): Result<T | U> {
    return new Result(() => {
      if (!this.#state.ok) {
        return onError(this.#state.error);
      }

      return this.#state.value;
    });
  }

  get ok() {
    return this.#state.ok;
  }

  get value() {
    if (this.#state.ok) {
      return this.#state.value;
    }

    return undefined;
  }

  get error() {
    if (!this.#state.ok) {
      return this.#state.error;
    }

    return undefined;
  }
}

const okResult = new Result(() => 42);

okResult.then((value) => {
  console.log(value); // 42
});

const errorResult = new Result(() => {
  throw 'Boom!';
});

errorResult

  .then((value) => {
    // Этот callback не вызовется

    console.log(value);
  })

  .catch((err) => {
    console.error(err); // Boom!
  });

function exec(createGenerator: () => Generator<Result<unknown>>) {
  const generator = createGenerator();

  let iteratorResult = generator.next();

  while (!iteratorResult.done) {
    const result = iteratorResult.value;

    if (result.ok) {
      iteratorResult = generator.next(result.value);
    } else {
      iteratorResult = generator.throw(result.error);
    }
  }
}

exec(function* main() {
  const okResult = new Result(() => 42);

  console.log(yield okResult); // 42

  try {
    const value = yield new Result(() => {
      throw 'Boom!';
    });
  } catch (err) {
    console.error(err); // Boom!
  }
});
