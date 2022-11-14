import type { ListenerMethods } from '../interfaces/listener';
import Stream from '../streams/stream';

export default function getProducerFromStream<T, R = T>(
  stream: Stream<T>,
  listener: ListenerMethods<T>,
): IterableIterator<R> {
  return {
    [Symbol.iterator]() {
      return this;
    },
    next: () => {
      stream.addListener(Stream.createListener(listener));
      return <IteratorReturnResult<undefined>>{ done: true, value: undefined };
    },
    return: () => {
      stream.removeListener(Stream.createListener(listener));
      return <IteratorReturnResult<undefined>>{ done: true, value: undefined };
    },
  };
}
