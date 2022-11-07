import type { Listener, FullListener } from '../interfaces/listener';
import type { Producer } from '../interfaces/producer';

// Producers
import FromIterable from '../producers/from_iterable';
import FromStream from '../producers/from_stream';
import FromValue from '../producers/from_value';
// Operators
import Take from '../operators/take';
import Map from '../operators/map';

// Aggregators
import Combine from '../aggregators/combine';

// Stream is an lazy event emitter with multiply Listeners
// When an event happens on the Stream, it is broadcast to all its Listeners at the same time.
// Stream can has A Producer is like a machine that produces events to be broadcast on a Stream.

// Stream with isMemoryStream = true flag is a Stream which can store the last broadcasted event
// Each new added listener will be immediately broadcasted with the last event
// (By default Stream will broadcast new values to the new added listeners)
export default class Stream<T> implements FullListener<T> {
  // Creates a new Stream given a Producer.
  static create<T>(producer?: Producer<T>): Stream<T> {
    if (producer) {
      if (
        typeof producer.start !== 'function' ||
        typeof producer.stop !== 'function'
      )
        throw new Error('producer requires both start and stop functions');
    }
    return new Stream(producer);
  }

  // Creates a new MemoryStream given a Producer.
  static createWithMemory<T>(producer?: Producer<T>): Stream<T> {
    if (producer) {
      if (
        typeof producer.start !== 'function' ||
        typeof producer.stop !== 'function'
      )
        throw new Error('producer requires both start and stop functions');
    }

    return new Stream<T>(producer as Producer<T>, true);
  }

  /**
   * Creates a Stream that does nothing when started. It never emits any event.
   *
   * Marble diagram:
   *
   * ```text
   *          never
   * -----------------------
   * ```
   */
  static never<T>(): Stream<T> {
    return new Stream<T>({
      start: () => {
        return;
      },
      stop: () => {
        return;
      },
    });
  }

  /**
   * Creates a Stream that immediately emits the "complete" notification when
   * started, and that's it.
   *
   * Marble diagram:
   *
   * ```text
   * empty
   * -|
   * ```
   */
  static empty<T>(): Stream<T> {
    return new Stream<T>({
      start(l: FullListener<T>) {
        l.complete();
      },
      stop: () => {
        return;
      },
    });
  }

  /**
   * Creates a Stream that immediately emits an "error" notification with the
   * value you passed as the `error` argument when the stream starts, and that's
   * it.
   *
   * Marble diagram:
   *
   * ```text
   * throw(X)
   * -X
   * ```
   */
  static throw(error: unknown): Stream<unknown> {
    return new Stream<unknown>({
      start(l: FullListener<unknown>) {
        l.error(error);
      },
      stop: () => {
        return;
      },
    });
  }

  /**
   * Converts an iterable to a stream. The returned stream will emit synchronously
   * all the items in the iterable, and then complete.
   *
   * Marble diagram:
   *
   * ```text
   * fromIterable([1,2,3])
   * 123|
   * ```
   */
  static fromIterable<T>(
    iterable: Iterable<T> | IterableIterator<T>,
  ): Stream<T> {
    return new Stream<T>(new FromIterable<T>(iterable));
  }

  /**
   * Create Stream with isMemoryStream = true to keep single value
   * based on single value
   * Dummy listener will be assigned to init last value
   * This value will be emitted immediately for each new listener
   *
   * Marble diagram:
   *
   * ```text
   * fromValue(1)
   * 1 for each new listener
   * ```
   */
  static fromValue<T extends string | number | boolean>(value: T): Stream<T> {
    const memoryStream = Stream.createWithMemory<T>(new FromValue(value));
    memoryStream.addListener({
      next: () => {
        return;
      },
    });
    return memoryStream;
  }

  /**
   * Create Stream with isMemoryStream = true to keep value
   * based on Stream
   * Stream will be converted to MemoryStream if it is not a Memory Stream
   * Dummy listener will be assigne to init a value
   *
   * Marble diagram:
   *
   * ```text
   * ```stream
   * --1----2-----3----4------5
   *                 *toValue(stream)
   * --------------------4--------5
   * init lastValue - 4
   * lastValue - 5
   * ```
   */
  static toValue<T>(stream: Stream<T>): Stream<T> {
    const memoryStream = Stream.toMemoryStream(stream);
    memoryStream.addListener({
      next: () => {
        return;
      },
    });
    return memoryStream;
  }

  /**
   * Creates a Stream that immediately emits the arguments that you give to
   * *of*, then completes.
   *
   * Marble diagram:
   *
   * ```text
   * of(1,2,3)
   * 123|
   * ```
   */
  static of<T>(...items: Array<T>): Stream<T> {
    return Stream.fromIterable<T>(items);
  }

  /**
   * Combines multiple input streams together to return a stream whose events
   * are arrays that collect the latest events from each input stream.
   *
   * *combine* internally remembers the most recent event from each of the input
   * streams. When any of the input streams emits an event, that event together
   * with all the other saved events are combined into an array. That array will
   * be emitted on the output stream. It's essentially a way of joining together
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static combine(...streams: Array<Stream<any>>): Stream<Array<any>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Stream<Array<any>>(new Combine<any>(streams));
  }

  /**
   * Create Stream with isMemoryStream = true to keep single value
   * if passed stream is memory it will return the same stream
   * ```
   */
  static toMemoryStream<T>(stream: Stream<T>): Stream<T> {
    if (stream.#isMemoryStream) {
      return stream;
    }
    return new Stream<T>(new FromStream<T>(stream), true);
  }

  producer: Producer<T> | null;
  #listeners: Array<Listener<T>>;
  #stopID: NodeJS.Timeout | null;
  #debugListener: Listener<T> | null;
  #imitationTarget: Stream<T> | null;
  #err: unknown | null;
  #lastValue: T | null;
  #isMemoryStream: boolean;

  constructor(producer?: Producer<T>, isMemoryStream = false) {
    this.producer = producer || null;
    this.#listeners = [];
    this.#stopID = null;
    this.#debugListener = null;
    this.#imitationTarget = null;
    this.#err = null;
    this.#isMemoryStream = isMemoryStream;
    this.#lastValue = null;
  }

  // tear down logic, after error or complete
  #clearStream(): void {
    this.#err = null;
    this.#listeners = [];
    this.#lastValue = null;
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

  // Stream itself is a Listener
  // It should implement next, error, complete methods
  next(value: T): void {
    if (this.#debugListener !== null) {
      this.#debugListener.next(value);
    }
    this.#lastValue = value;
    for (const listener of this.#listeners) {
      listener.next(value);
    }
  }

  error(err: unknown): void {
    this.#err = err;

    if (this.producer !== null) {
      this.producer.stop();
    }

    if (this.#debugListener == null && this.#listeners.length === 0) {
      throw this.#err;
    }

    if (
      this.#debugListener !== null &&
      this.#debugListener?.error !== undefined
    ) {
      this.#debugListener.error(err);
    }

    for (const listener of this.#listeners) {
      if (listener?.error !== undefined) {
        listener.error(err);
      }
    }

    this.#clearStream();
  }

  complete(): void {
    if (this.producer !== null) {
      this.producer.stop();
    }

    if (
      this.#debugListener !== null &&
      this.#debugListener?.complete !== undefined
    ) {
      this.#debugListener.complete();
    }
    for (const listener of this.#listeners) {
      if (listener?.complete !== undefined) {
        listener.complete();
      }
    }
    this.#clearStream();
  }

  // Add a Listener to the Stream.
  addListener(listener: Listener<T>): void {
    if (this.#imitationTarget !== null) {
      this.#imitationTarget.addListener(listener);
      return;
    }

    if (this.#isMemoryStream && this.#lastValue !== null) {
      listener.next(this.#lastValue);
    }

    this.#listeners.push(listener);

    if (this.#listeners.length === 1) {
      // Start producer when the first listener was added
      if (this.producer !== null) {
        this.producer.start(this);
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.producer!.stop();
    this.#stopID = null;
    this.#lastValue = null;
  }

  // Removes a Listener from the Stream, assuming the Listener was added to it.
  removeListener(listener: Listener<T>): void {
    if (this.#imitationTarget !== null) {
      this.#imitationTarget.removeListener(listener);
      return;
    }

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
  take(num: number): Stream<T> {
    return new Stream<T>(new Take<T>(num, this), this.#isMemoryStream);
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
  map<U>(cb: (t: T) => U): Stream<U> {
    return new Stream<U>(new Map<T, U>(cb, this), this.#isMemoryStream);
  }
}
