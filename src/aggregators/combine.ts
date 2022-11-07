/* eslint-disable @typescript-eslint/no-explicit-any */
import Stream from '../streams/stream';
import type { Aggregator } from '../interfaces/aggregator';

export default class Combine<R = any> implements Aggregator<any, Array<R>> {
  type = 'combine';
  inStreams: Array<Stream<any>>;
  outStream: Stream<Array<R>> | null;
  #listenerStreams: Array<Stream<any>>;
  #notCompletedStreams: number;
  #isAllStarted: boolean;

  constructor(inStreams: Array<Stream<any>>) {
    this.inStreams = inStreams;
    this.outStream = null;
    this.#notCompletedStreams = 0;
    this.#isAllStarted = false;
    this.#listenerStreams = Array(inStreams.length)
      .fill(undefined)
      .map(() => this.#createStreamListener());
  }

  // Create new listener as a Stream with isMemoryStream = true
  // to keep the last value of the stream
  #createStreamListener() {
    const listener = Stream.createWithMemory(undefined);
    // AddListener of this object to call Combine.next
    // each time when inStream broadcast value
    listener.addListener(this);
    return listener;
  }

  start(outStream: Stream<Array<R>>): void {
    this.outStream = outStream;
    if (this.inStreams.length === 0) {
      outStream.complete();
    } else {
      for (const inStream of this.inStreams) {
        inStream.addListener(this.#listenerStreams[this.#notCompletedStreams]);
        this.#notCompletedStreams++;
      }

      this.#isAllStarted = true;
      this.next(undefined);
    }
  }

  stop(): void {
    // The order of listeners should correspond to the order of inStreams
    let indx = 0;
    for (const inStream of this.inStreams) {
      this.#listenerStreams[indx].removeListener(this);
      inStream.removeListener(this.#listenerStreams[indx]);
      indx++;
    }

    this.outStream = null;
    this.#listenerStreams = [];
    this.#notCompletedStreams = 0;
    this.#isAllStarted = false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next(_: unknown) {
    if (this.outStream === null) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values = <any>[];

    for (const listenerStream of this.#listenerStreams) {
      const lastValue = listenerStream.getLastValue();
      values.push(lastValue);
    }

    // Broadcast value when each of combined stream get the appropriate listener
    if (this.#isAllStarted) {
      this.outStream.next(values);
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

    this.#notCompletedStreams--;

    if (this.#notCompletedStreams === 0) {
      this.outStream.complete();
    }
  }
}
