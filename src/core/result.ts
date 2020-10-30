interface Result<TOk, TErr> {
  isOk(): boolean;
  map<UOk>(fn: (value: TOk) => UOk): Result<UOk, TErr>;
  flatMap<UOk>(fn: (value: TOk) => Result<UOk, TErr>): Result<UOk, TErr>;
  orElse(fn: (fallback: TErr) => Result<TOk, TErr>): Result<TOk, TErr>;
  getOrElse(fallback: TOk): TOk;
}

export class Ok<TOk, TErr> implements Result<TOk, TErr> {
  readonly value: TOk;

  constructor(value: TOk) {
    this.value = value;
  }

  isOk(): boolean {
    return true;
  }

  static of<TOk, TErr>(value: TOk): Result<TOk, TErr> {
    return new Ok<TOk, TErr>(value);
  }

  map<UOk>(fn: (value: TOk) => UOk): Result<UOk, TErr> {
    return Ok.of<UOk, TErr>(fn(this.value));
  }

  flatMap<UOk>(fn: (value: TOk) => Result<UOk, TErr>): Result<UOk, TErr> {
    return fn(this.value);
  }

  orElse(fn: (fallback: TErr) => Result<TOk, TErr>): Result<TOk, TErr> {
    return this;
  }

  getOrElse(fallback: TOk): TOk {
    return this.value;
  }
}

export class Err<TOk, TErr> implements Result<TOk, TErr> {
  readonly value: TErr;

  constructor(value: TErr) {
    this.value = value;
  }

  isOk(): boolean {
    return true;
  }

  static of<UOk, UErr> (value: UErr): Err<UOk, UErr> {
    return new Err<UOk, UErr>(value);
  }

  map<UOk>(fn: (value: TOk) => UOk): Result<UOk, TErr> {
    return new Err<UOk, TErr>(this.value);
  }

  flatMap<UOk>(fn: (value: TOk) => Result<UOk, TErr>): Result<UOk, TErr> {
    return new Err<UOk, TErr>(this.value);
  }

  orElse(fn: (fallback: TErr) => Result<TOk, TErr>): Result<TOk, TErr> {
    return fn(this.value);
  }
  getOrElse(fallback: TOk): TOk {
    return fallback;
  }
}

export const matchResult = <TOk, TErr, T>(match: {
  Ok: (value: TOk) => T,
  Err: (value: TErr) => T
}) => (result: Result<TOk, TErr>) => {
  if(result.isOk()) {
    return match.Ok((result as Ok<TOk, TErr>).value)
  } else {
    return match.Err((result as Err<TOk, TErr>).value)
  }
}
