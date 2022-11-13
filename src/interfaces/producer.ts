export type Producer<T> =
  | AsyncGenerator<T>
  | AsyncIterable<T>
  | AsyncIterableIterator<T>
  | Generator<T>
  | Iterable<T>
  | IterableIterator<T>;

export type ProducerIterator<T> = AsyncIterator<T> | Iterator<T>;
