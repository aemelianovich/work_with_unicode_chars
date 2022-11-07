import type { Producer } from '../interfaces/producer';
import type { FullListener } from '../interfaces/listener';
import type Stream from '../streams/stream';

export default class FromStream<T> implements Producer<T> {
  type = 'fromStream';
  stream: Stream<T>;
  #listener: FullListener<T> | null;

  constructor(stream: Stream<T>) {
    this.stream = stream;
    this.#listener = null;
  }

  start(listener: FullListener<T>): void {
    this.#listener = listener;
    this.stream.addListener(listener);
  }
  stop() {
    if (this.#listener !== null) {
      this.stream.removeListener(this.#listener);
    }
  }
}
