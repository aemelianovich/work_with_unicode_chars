import type { Producer } from './producer';
import type { FullListener } from './listener';
import type Stream from '../streams/stream';

export interface Operator<T, R> extends Producer<R>, FullListener<T> {
  type: string;
  inStream: Stream<T>;
  outStream: Stream<R> | null;
  start(outStream: Stream<R>): void;
}
