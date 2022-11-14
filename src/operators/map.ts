import Stream from '../streams/stream';
import getProducerFromStream from '../producers/from_stream';

export function map<T, R>(cb: (value: T) => R, inStream: Stream<T>): Stream<R> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let outStream = <Stream<R>>(<any>null);

  const listener = {
    next: (value: T) => {
      const res = cb(value);
      outStream.next(res);
    },
    return: (value: T | undefined) => {
      let res = undefined;
      if (value !== undefined) {
        res = cb(value);
      }
      outStream.return(res);
    },
    throw: (err: unknown) => {
      outStream.throw(err);
    },
  };

  const mapProducer = getProducerFromStream<T, R>(inStream, listener);

  outStream = new Stream<R>(mapProducer, {
    isMemoryStream: inStream.options.isMemoryStream,
    isInfiniteStream: true,
  });

  return outStream;
}
