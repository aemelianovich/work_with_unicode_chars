import type { Listener } from './listener';

export interface Producer<T> {
  start(listener: Listener<T>): void;
  stop: () => void;
}
