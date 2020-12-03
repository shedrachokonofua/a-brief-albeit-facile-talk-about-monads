# A brief albeit facile talk about monads

## Intro
Today I'll be going through 2 common monads that are both simple to adopt and evidently beneficial.
I'll be skipping the (loaded) mathematical background of monads and Functional Programming, but if that's something you'd want to check out, I'd recommend Giulio Canti's [Introduction to Functional Programming](https://github.com/gcanti/functional-programming) where he works through the theoretical foundations of FP all the way up to the composition of monads. 

## It's all about composition
Monads are FP constructs that attempt to abstract away the procedures involved in sequencing and control flow. With the right monads we can enjoy the powerful **compositional** flow and referential transparency that FP allows us, even as we represent complex branching problems that may or may not succeed.

### Maybe Monad
We often encounter computations in which there might potentially be no result, often we'd reach for, or be handed, a null value and call it day. What's so wrong with that? Well not a lot if you work in a type system that comes with null-safety i.e. your compiler can tell which values may or may not be null/undefined at compile time and refuse to build if you're doing anything unsound, otherwise any non-trivial code base is bound to become rich in null-checks, and almost no way to know certainly which functions may return null/undefined without getting involved in their details. The `Maybe` monad offers us an elegant alternative, wrap the return value in a `Just` if available otherwise return a `Nothing`.

```typescript
const unsafeHead = (list: number[]): number => list[0];

const safeHead = (list: number[]): Maybe.Maybe<number> => Maybe.fromNullable(list[0]);
// const head = (list: number[]): Maybe.Maybe<number> => value === undefined ? Maybe.Just.of(value) : Maybe.Nothing.of();
```

Ok nice, but why would anyone want to go through that trouble? Like I said earlier, compositional flow. 
Let's say we want to find the square of the head of a list of numbers.

```typescript
const list = [];
const square = (x: number) => number * number;

const unsafeHead = (list: number[]) => list[0];
const unsafeHeadSquare = ((list: number[]) => {
  const head = unsafeHead(list);
  return head != undefined ? square(head) : 0;
})(list);


const safeHead = (list: number[]) => fromNullable(list[0]);
const safeHeadSquare = safeHead(list).map(square).getOrElse(0);
```

Contrived? Yes, but we can see the composition flow in action. Let's take a look at a slightly more interesting example, in React this time.

```tsx
const FilterableList = () => {
  const [query, setQuery] = useState('');
  const items = [
    { text: 'Hello World', language: 'English' },
    { text: 'Bonjour monde!', language: 'French' },
    { text: 'Hallo Wereld!' },
    { text: 'Hola Mundo' }
  ];

  const handleChange = ({ target: { value: string } }) => setQuery(value);

  const getProp = (prop: string) => (object: Object) => fromNullable(object[prop]);
  const findLanguage = (text: string) =>
    fromNullable(items.find(item => item.text === text))
      .flatMap(getProp('language'))
      .getOrElse('Unknown');

  const searchResult = findLanguage(query);

  return (
    <div>
      <h1>Type in hello world in any language</h1>
      <input type="text" value={query} onChange={handleChange} />
      <div>
        <span>Language: {searchResult}</span>
      </div>
    </div>
  );
}

```


### Result Monad
What about computations that might fail? The usual approach in most languages is to throw an *Exception* whether or not the failure was truly *exceptional* i.e. if failure could be a rational outcome of the computation in question. This is a critical  but often overlooked distinction. In many problems, failure cases are first-class citizens that carry as much business domain context as success cases, we often have to differentiate domain errors and invariants from techinical errors. Take a login procedure with a limited amount of tries, there are 2 obvious domain errors here: 
- a failed login attempt due to invalid creditials, and
- too many failed login attempts due to invalid creditials.

There could be any number technical errors depending on the implementation specifics but they usually signal that the environment(cpu, memory, database, networking, etc.) is not behaving as the program would normally expect, regardless of whether or not all business invariants have been met, that is to say, there's something *exceptional* about this case.
One approach to dealing with the distinction between Failures and Exceptions is using checked exceptions:

```typescript
try {
  return login()
} catch(err) {
  if (err.name === 'InvalidCreditials') return handleInvalidCredentials();
  if (err.name === 'TooManyLoginAttempts') return handleTooManyLoginAttempts();
  else throw err;
}
```

This satisfies most needs, we could pad the error object with any additional meta we might need in the failure cases and call it day. But how could we approach this compositionally without breaking control flow? Enter the `Result` monad. It's similar to the `Maybe` monad in that it's a sum type with one variant represent a happy case `Ok` and another representing an unhappy case `Err` except we can wrap additional data about the unhappy case into the `Err` variant unlike `Nothing`.

```typescript
type InvalidCreditialsFailure = {
  name: 'InvalidCreditialsFailure',
  attempts: number
};

type TooManyLoginAttemptsFailure = {
  name: 'TooManyLoginAttempts'
};

type LoginFailure = InvalidCreditialsFailure | TooManyLoginAttemptsFailure;

const isTooManyAttempts = attempts => attempts > 5;

const checkTooManyAttempts = async (creds) => (failure) => {
  if (failure.name !== 'InvalidCreditialsFailure') return failure;

  return userRepository
    .getLoginAttempts(creds)
    .flatMap((attempts) => isTooManyAttempts ? Ok() : Err({
      name: 'TooManyLoginAttemptsFailure'
    }));
}

const login: Result<User, LoginFailure> = async (creds) => {
  return userRepository
    .getUserByCreds(creds)
    .orElse(checkTooManyAttempts(creds));
};

const handleLoginFailure = {
  'InvalidCreditialsFailure': ({ attempts }) => console.log(`Invalid Creds, ${attempts} attempts made`),
  'TooManyLoginAttemptsFailure': () => console.log('Too Many Login Attempts')
}

const handleLoginResult = matchResult({
  Ok: (user: User) => console.log(`Hello ${user.firstName}`),
  Err: (failure: LoginFailure) => handleLoginFailure[failure.name](failure)
})

try {
  const result = await login(creds);
  handleLoginResult(result);
} catch (err) {}

```
