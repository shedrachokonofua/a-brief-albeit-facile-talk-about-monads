interface Maybe<A> {
  isJust(): boolean;
  map<B>(fn: (value: A) => B): Maybe<B>;
  flatMap<B>(fn: (value: A) => Maybe<B>): Maybe<B>;
  orElse(handler: () => Maybe<A>): Maybe<A>
  getOrElse(fallback: A): A;
}

export class Just<A> implements Maybe<A> {
  private value: A;

  constructor(value: A) {
    this.value = value;
  }

  isJust(): boolean {
    return true;
  }

  static of<A>(value: A): Just<A> {
    return new Just(value);
  }

  flatMap<B>(fn: (value: A) => Maybe<B>): Maybe<B> {
    return fn(this.value);
  }

  map<B>(fn: (value: A) => B): Maybe<B> {
    return Just.of(fn(this.value));
  }

  orElse(handler: () => Maybe<A>): Maybe<A> {
    return this;
  }

  getOrElse(fallback: A): A {
    return this.value;
  }
}

export class Nothing<A> implements Maybe<A> {
  isJust(): boolean {
    return false;
  }

  static of<A>(): Nothing<A> {
    return new Nothing();
  }

  flatMap<B>(fn: (value: A) => Maybe<B>): Nothing<B> {
    return new Nothing();
  }

  map<B>(fn: (value: A) => B): Nothing<B> {
    return new Nothing();
  }

  orElse(handler: () => Maybe<A>): Maybe<A> {
    return handler();
  }

  getOrElse(fallback: A): A {
    return fallback;
  }
}

export function fromNullable<T>(value: T | null): Maybe<T> {
  return value === null || value === undefined ? Just.of(value) : Nothing.of();
}
