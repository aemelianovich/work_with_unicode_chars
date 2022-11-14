export type Listener<T> =
  | AsyncGenerator<T | undefined>
  | Generator<T | undefined>;

export type ListenerMethods<T> = {
  next: (value: T) => void;
  return?: (value?: T) => void;
  throw?: (err: unknown) => void;
};
