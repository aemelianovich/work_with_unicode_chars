import type { Producer } from './producer';
import type Stream from '../streams/stream';
import type { FullListener } from './listener';

export interface Aggregator<T, U> extends Producer<U>, FullListener<T> {
  type: string;
  inStreams: Array<Stream<T>>;
  outStream: Stream<U> | null;
  start(outStream: Stream<U>): void;
}
