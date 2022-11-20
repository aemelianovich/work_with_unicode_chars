/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-this-alias */

// Stream is an lazy event emitter.
// Based on the stream you can create iterator and recieve a new value from the stream
export default class Stream<T> implements AsyncIterable<T> {
  //
  ////////////////////// Specific producers
  //
  static fromValue<T extends number | string>(value: T): Stream<T> {
    const iterable = {
      value: value,

      updateValue(fn: (value: T) => T) {
        this.value = fn(value);
      },

      [Symbol.iterator]() {
        const value = this.value;
        return {
          [Symbol.iterator]() {
            return this;
          },
          isDone: false,
          next() {
            if (this.isDone) {
              return { done: true, value: undefined };
            }
            this.isDone = true;
            return { done: false, value };
          },
        };
      },
    };

    return new Stream(<Iterable<T>>iterable);
  }

  //
  ////////////////////// Aggregators
  //

  /**
   * Combines multiple input streams together to return a stream whose events
   * are arrays that collect the latest events from each input stream.
   *
   * It's essentially a way of joining together
   * the events from multiple streams.
   *
   * Marble diagram:
   *
   * ```text
   * --1----2-----3--------4---
   * ----a-----b-----c--d------
   *          combine
   * ----1a-2a-2b-3b-3c-3d-4d--
   * ```
   */
  static combine(...streams: Array<Stream<any>>): Stream<Array<any>> {
    const getAsyncGen = async function* () {
      const iterators = streams.map((stream) => stream[Symbol.asyncIterator]());

      while (true) {
        const values = <any>[];
        let done = true;
        for (const iter of iterators) {
          const res = await iter.next();
          if (res.done === false) {
            done = res.done;
          }
          values.push(res.value);
        }

        if (done) {
          return;
        }

        yield values;
      }
    };

    return new Stream(getAsyncGen);
  }

  //
  ////////////////////// Properties & Constructor
  //
  #producer: AsyncIterable<T> | Iterable<T> | (() => AsyncGenerator<T>);

  constructor(
    producer: AsyncIterable<T> | Iterable<T> | (() => AsyncGenerator<T>),
  ) {
    this.#producer = producer;
  }

  async *[Symbol.asyncIterator]() {
    let iterable;
    if (typeof this.#producer === 'function') {
      iterable = this.#producer();
    } else {
      iterable = this.#producer;
    }

    yield* iterable;
  }

  //
  ////////////////////// Operators
  //
  /**
   * Lets the first number of events from the input stream pass to the
   * output stream, then makes the output stream complete.
   *
   * Marble diagram:
   *
   * ```text
   * --a---b--c----d---e--
   *    take(3)
   * --a---b--c|
   * ```
   *
   */
  take(max: number): Stream<T> {
    const iter = this;

    const getAsyncGen = async function* () {
      let num = 0;

      if (max <= 0) {
        return;
      }
      for await (const value of iter) {
        yield value;
        num++;
        if (num === max) {
          return;
        }
      }
    };

    return new Stream(getAsyncGen);
  }

  /**
   * Transforms each event from the input Stream through a cb(callback) function,
   * to get a Stream that emits those transformed events.
   *
   * Marble diagram:
   *
   * ```text
   * --1---3--5-----7------
   *    map(i => i * 10)
   * --10--30-50----70-----
   * ```
   */
  map<R>(fn: (value: T) => R): Stream<R> {
    const iter = this;

    const getAsyncGen = async function* () {
      for await (const value of iter) {
        yield fn(value);
      }
    };

    return new Stream(getAsyncGen);
  }

  async getValue(): Promise<T> {
    const iter = this[Symbol.asyncIterator]();
    const res = await iter.next();
    if (res.value !== undefined) {
      return res.value;
    }

    throw new Error('Unable to get a value');
  }

  updateValue(fn: (value: T) => T) {
    const valProducer = <any>this.#producer;
    if (valProducer.updateValue !== undefined) {
      valProducer.updateValue(fn);
      return;
    }

    throw new Error('Not a single value producer');
  }
}
