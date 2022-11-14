import Stream from '../streams/stream';
import getProducerFromStream from '../producers/from_stream';

export function take<T>(max: number, inStream: Stream<T>): Stream<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let outStream = <Stream<T>>(<any>null);
  let taken = 0;

  const listener = {
    next: (value: T) => {
      if (taken < max) {
        outStream.next(value);
        taken++;
      }

      if (taken === max) {
        outStream.return(undefined);
      }
    },
    return: (value: T | undefined) => {
      outStream.return(value);
    },
    throw: (err: unknown) => {
      outStream.throw(err);
    },
  };

  const takeProducer = getProducerFromStream<T>(inStream, listener);

  outStream = new Stream<T>(takeProducer, {
    isMemoryStream: inStream.options.isMemoryStream,
    isInfiniteStream: true,
  });

  return outStream;
}
