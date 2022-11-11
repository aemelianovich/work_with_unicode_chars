import type { Producer } from '../interfaces/producer';
import type { FullListener } from '../interfaces/listener';

export default class FromValue<T> implements Producer<T> {
  type = 'fromValue';
  value: T;

  constructor(value: T) {
    this.value = value;
  }

  start(listener: FullListener<T>): void {
    listener.next(this.value);
  }
  stop() {
    return;
  }
}
