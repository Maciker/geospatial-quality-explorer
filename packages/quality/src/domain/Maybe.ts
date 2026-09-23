export class Maybe<T> {
  private constructor(private readonly content: T | null) {}

  static some<T>(value: T): Maybe<T> {
    return new Maybe(value);
  }

  static none<T>(): Maybe<T> {
    return new Maybe<T>(null);
  }

  static fromNullable<T>(value: T | null): Maybe<T> {
    if (value === null) return Maybe.none();
    return Maybe.some(value);
  }

  map<U>(mapper: (value: T) => U): Maybe<U> {
    if (this.content === null) return Maybe.none();
    return Maybe.some(mapper(this.content));
  }

  orElseThrow(error: Error): T {
    if (this.content === null) throw error;
    return this.content;
  }
}
