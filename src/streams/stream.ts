import type { Listener } from '../interfaces/listener';
import type { Producer, ProducerIterator } from '../interfaces/producer';

// // Producers
// import FromIterable from '../producers/from_iterable';
// import FromStream from '../producers/from_stream';
// import FromValue from '../producers/from_value';
// // Operators
// import Take from '../operators/take';
// import Map from '../operators/map';

// // Aggregators
// import Combine from '../aggregators/combine';

// Stream is an lazy event emitter with multiply Listeners
// When an event happens on the Stream, it is broadcast to all its Listeners at the same time.
// Stream can has A Producer is like a machine that produces events to be broadcast on a Stream.

// Stream itself implements AsyncGenerator interface and can be used as Listener or Producer

// Stream with isMemoryStream = true flag is a Stream which can store the last broadcasted event
// Each new added listener will be immediately broadcasted with the last event
// (By default Stream will broadcast new values to the new added listeners)
export default class Stream<T> implements AsyncGenerator<T> {
  producer: Producer<T> | null;
  #producerIter: ProducerIterator<T> | null;
  #listeners: Array<Listener<T>>;
  #stopID: NodeJS.Timeout | null;
  #err: unknown | null;
  #lastValue: T | null;
  #isMemoryStream: boolean;

  constructor(producer?: Producer<T>, isMemoryStream = false) {
    this.producer = producer || null;
    this.#producerIter = null;
    this.#listeners = [];
    this.#stopID = null;
    this.#err = null;
    this.#isMemoryStream = isMemoryStream;
    this.#lastValue = null;
  }

  [Symbol.asyncIterator]() {
    return this;
  }

  // tear down logic, after error or complete
  #clearStream(): void {
    this.#err = null;
    this.#listeners = [];
    this.#lastValue = null;
    this.#producerIter = null;
  }

  // We can ask value only from memory stream
  getLastValue(): T | null {
    if (this.#isMemoryStream) {
      return this.#lastValue;
    }

    throw new Error('Not a memory stream');
  }

  // We can update value only in memory stream
  // It will immediately brodcast updated value
  updateLastValue(cb: (value: T | null) => T): void {
    if (this.#isMemoryStream) {
      const res = cb(this.#lastValue);
      this.#lastValue = res;
      this.next(res);
      return;
    }

    throw new Error('Not a memory stream');
  }

  async #startStream() {
    if (this.producer === null) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const producer = <any>this.producer;

    if (typeof producer[Symbol.asyncIterator] === 'function') {
      this.#producerIter = <AsyncIterator<T>>producer[Symbol.asyncIterator]();
    } else if (typeof producer[Symbol.iterator] === 'function') {
      this.#producerIter = <Iterator<T>>producer[Symbol.iterator]();
    }

    let value: T | undefined;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-constant-condition
      while (true) {
        const res = await this.#producerIter!.next();
        value = res.value;

        if (res.done) {
          break;
        } else {
          this.next(value);
        }
      }
      // for await (const value of <any>this.#producerIter) {
      //   this.next(value);
      // }
    } catch (err) {
      this.throw(err);
      return;
    }

    this.return(value);
  }

  // Stream itself is a AsyncIterator
  // It should implement next, return, throw methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async next(...values: [T | undefined]): Promise<IteratorResult<T | any>> {
    this.#lastValue = values[values.length - 1] || null;
    for (const listener of this.#listeners) {
      listener.next(...values);
    }
    return { done: false, value: this.#lastValue };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async return(...values: [T | undefined]): Promise<IteratorResult<T | any>> {
    if (
      this.#producerIter !== null &&
      typeof this.#producerIter.return === 'function'
    ) {
      this.#producerIter.return(...values);
    }

    for (const listener of this.#listeners) {
      listener.return(...values);
    }

    this.#clearStream();
    return { done: true, value: this.#lastValue };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async throw(e: unknown): Promise<IteratorResult<T | any>> {
    this.#err = e;

    if (
      this.#producerIter !== null &&
      typeof this.#producerIter.return === 'function'
    ) {
      this.#producerIter.return();
    }

    for (const listener of this.#listeners) {
      listener.throw(e);
    }

    this.#clearStream();
    return { done: true, value: undefined };
  }

  // Add a Listener to the Stream.
  addListener(listener: Listener<T>): void {
    if (this.#isMemoryStream && this.#lastValue !== null) {
      listener.next(this.#lastValue);
    }

    this.#listeners.push(listener);

    if (this.#listeners.length === 1) {
      // Start producer when the first listener was added
      if (this.producer !== null) {
        this.#startStream();
      }

      // Check whether async stop request was created when number of listeners were 0
      // stop is async operation in case if we need remove one listener and immediately add another listener
      // Once we added a new listener then we do not need to stop the stream
      if (this.#stopID !== null) {
        clearTimeout(this.#stopID);
        this.#stopID = null;
      }
    }
  }

  #stopNow() {
    if (
      this.#producerIter !== null &&
      typeof this.#producerIter.return === 'function'
    ) {
      this.#producerIter.return();
    }
    this.#clearStream();
  }

  // Removes a Listener from the Stream, assuming the Listener was added to it.
  removeListener(listener: Listener<T>): void {
    const i = this.#listeners.indexOf(listener);
    if (i > -1) {
      this.#listeners.splice(i, 1);
      // Stop producer if all listeners were removed
      // Do it in async way in case if user would like to remove one listener and immediately add another listener
      if (this.producer !== null && this.#listeners.length === 0) {
        this.#stopID = setTimeout(() => this.#stopNow());
      }
    }
  }

  // tear down logic, after error or complete
  // #clearStream(): void {
  //   this.#err = null;
  //   this.#listeners = [];
  //   this.#lastValue = null;
  // }

  // We can ask value only from memory stream
  // getLastValue(): T | null {
  //   if (this.#isMemoryStream) {
  //     return this.#lastValue;
  //   }

  //   throw new Error('Not a memory stream');
  // }

  // We can update value only in memory stream
  // It will immediately brodcast updated value
  // updateLastValue(cb: (value: T | null) => T): void {
  //   if (this.#isMemoryStream) {
  //     const res = cb(this.#lastValue);
  //     this.#lastValue = res;
  //     this.next(res);
  //     return;
  //   }

  //   throw new Error('Not a memory stream');
  // }

  // start the stream and send values to the all listeners
  // async startStream() {

  // }

  // Stream itself is a Listener
  // It should implement next, error, complete methods
  // async next(value: T): void {
  //   if (this.producer === null) {
  //     throw new Error('Unable to start a stream with empty producer');
  //   }

  //   for await (const value of this.producer) {
  //     this.#lastValue = value;

  //     for (const listener of this.#listeners) {
  //       listener.next(value);
  //     }
  //   }
  // }

  // error(err: unknown): void {
  //   this.#err = err;

  //   if (this.producer !== null) {
  //     this.producer.stop();
  //   }

  //   if (this.#debugListener == null && this.#listeners.length === 0) {
  //     throw this.#err;
  //   }

  //   if (
  //     this.#debugListener !== null &&
  //     this.#debugListener?.error !== undefined
  //   ) {
  //     this.#debugListener.error(err);
  //   }

  //   for (const listener of this.#listeners) {
  //     if (listener?.error !== undefined) {
  //       listener.error(err);
  //     }
  //   }

  //   this.#clearStream();
  // }

  // complete(): void {
  //   if (this.producer !== null) {
  //     this.producer.stop();
  //   }

  //   if (
  //     this.#debugListener !== null &&
  //     this.#debugListener?.complete !== undefined
  //   ) {
  //     this.#debugListener.complete();
  //   }
  //   for (const listener of this.#listeners) {
  //     if (listener?.complete !== undefined) {
  //       listener.complete();
  //     }
  //   }
  //   this.#clearStream();
  // }

  // Add a Listener to the Stream.
  // addListener(listener: Listener<T>): void {
  //   if (this.#imitationTarget !== null) {
  //     this.#imitationTarget.addListener(listener);
  //     return;
  //   }

  //   if (this.#isMemoryStream && this.#lastValue !== null) {
  //     listener.next(this.#lastValue);
  //   }

  //   this.#listeners.push(listener);

  //   if (this.#listeners.length === 1) {
  //     // Start producer when the first listener was added
  //     if (this.producer !== null) {
  //       this.producer.start(this);
  //     }

  //     // Check whether async stop request was created when number of listeners were 0
  //     // stop is async operation in case if we need remove one listener and immediately add another listener
  //     // Once we added a new listener then we do not need to stop the stream
  //     if (this.#stopID !== null) {
  //       clearTimeout(this.#stopID);
  //       this.#stopID = null;
  //     }
  //   }
  // }

  // #stopNow() {
  //   // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  //   this.producer!.stop();
  //   this.#stopID = null;
  //   this.#lastValue = null;
  // }

  // Removes a Listener from the Stream, assuming the Listener was added to it.
  // removeListener(listener: Listener<T>): void {
  //   if (this.#imitationTarget !== null) {
  //     this.#imitationTarget.removeListener(listener);
  //     return;
  //   }

  //   const i = this.#listeners.indexOf(listener);
  //   if (i > -1) {
  //     this.#listeners.splice(i, 1);
  //     // Stop producer if all listeners were removed
  //     // Do it in async way in case if user would like to remove one listener and immediately add another listener
  //     if (this.producer !== null && this.#listeners.length === 0) {
  //       this.#stopID = setTimeout(() => this.#stopNow());
  //     }
  //   }
  // }

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
  // take(num: number): Stream<T> {
  //   return new Stream<T>(new Take<T>(num, this), this.#isMemoryStream);
  // }

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
  // map<U>(cb: (t: T) => U): Stream<U> {
  //   return new Stream<U>(new Map<T, U>(cb, this), this.#isMemoryStream);
  // }
}
