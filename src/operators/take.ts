import type { Operator } from '../interfaces/operator';
import type Stream from '../streams/stream';

export default class Take<T> implements Operator<T, T> {
  #taken: number;
  type = 'take';
  inStream: Stream<T>;
  outStream: Stream<T> | null;
  max: number;

  constructor(max: number, inStream: Stream<T>) {
    this.inStream = inStream;
    this.outStream = null;
    this.max = max;
    this.#taken = 0;
  }

  start(outStream: Stream<T>): void {
    this.outStream = outStream;
    this.#taken = 0;

    if (this.max <= 0) {
      outStream.complete();
    } else {
      this.inStream.addListener(this);
    }
  }

  stop(): void {
    this.inStream.removeListener(this);
    this.outStream = null;
  }

  next(value: T) {
    if (this.outStream === null) {
      return;
    }

    if (this.#taken < this.max) {
      this.outStream.next(value);
      this.#taken++;
    }

    if (this.#taken === this.max) {
      this.outStream.complete();
    }
  }

  error(err: unknown) {
    if (this.outStream === null) {
      return;
    }
    this.outStream.error(err);
  }

  complete() {
    if (this.outStream === null) {
      return;
    }
    this.outStream.complete();
  }
}
