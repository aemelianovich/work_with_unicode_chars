import type { Producer } from '../interfaces/producer';
import type { FullListener } from '../interfaces/listener';

export default class FromIterable<T> implements Producer<T> {
  type = 'fromIterable';
  iterable: Iterable<T> | IterableIterator<T>;

  constructor(iterable: Iterable<T> | IterableIterator<T>) {
    this.iterable = iterable;
  }

  start(listener: FullListener<T>): void {
    for (const item of this.iterable) {
      listener.next(item);
    }
    listener.complete();
  }
  stop() {
    return;
  }
}
