import type { Operator } from '../interfaces/operator';
import type Stream from '../streams/stream';

export default class Map<T, R> implements Operator<T, R> {
  type = 'map';
  inStream: Stream<T>;
  outStream: Stream<R> | null;
  cb: (value: T) => R;

  constructor(cb: (value: T) => R, inStream: Stream<T>) {
    this.inStream = inStream;
    this.outStream = null;
    this.cb = cb;
  }

  start(outStream: Stream<R>): void {
    this.outStream = outStream;
    this.inStream.addListener(this);
  }

  stop(): void {
    this.inStream.removeListener(this);
    this.outStream = null;
  }

  next(value: T) {
    if (this.outStream === null) {
      return;
    }

    try {
      const res = this.cb(value);
      this.outStream.next(res);
    } catch (err) {
      this.error(err);
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
