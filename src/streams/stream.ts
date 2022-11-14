import type { Listener, ListenerMethods } from '../interfaces/listener';
import type { Producer, ProducerIterator } from '../interfaces/producer';
import type { StreamOptions } from '../interfaces/stream_options';

// Operators
import { map } from '../operators/map';
import { take } from '../operators/take';

// Producers
import getProducerFromStream from '../producers/from_stream';

// Aggregators
// import Combine from '../aggregators/combine';

// Stream is an lazy event emitter with multiply Listeners
// When an event happens on the Stream, it is broadcast to all its Listeners at the same time.
// Stream can has A Producer is like a machine that produces events to be broadcast on a Stream.

// Stream itself implements AsyncGenerator interface and can be used as Listener

// Stream with isMemoryStream = true flag is a Stream which can store the last broadcasted event
// Each new added listener will be immediately broadcasted with the last event
// (By default Stream will broadcast new values to the new added listeners)
export default class Stream<T> implements AsyncGenerator<T> {
  // Create listener from object with methods next, return, throw
  static createListener<T>(
    methods: ListenerMethods<T>,
  ): Generator<T | undefined> {
    function* create(): Generator<T | undefined, T | undefined, T> {
      while (true) {
        const res = yield;
        methods.next(res);
      }
    }

    const generator = create();

    generator.return = (value) => {
      if (methods.return !== undefined) {
        methods.return(value);
      }
      return { done: true, value: value };
    };

    generator.throw = (err) => {
      if (methods.throw !== undefined) {
        methods.throw(err);
      }
      return { done: true, value: undefined };
    };

    generator.next();
    return generator;
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
    const options = {
      isMemoryStream: false,
      isInfiniteStream: true,
    };

    const neverStream = new Stream<T>([], options);

    return neverStream;
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
    const options = {
      isMemoryStream: false,
      isInfiniteStream: false,
    };

    const emptyStream = new Stream<T>([], options);

    return emptyStream;
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
    const options = {
      isMemoryStream: false,
      isInfiniteStream: false,
    };

    const errorIter = function* () {
      throw error;
      yield;
    };

    const throwStream = new Stream<unknown>(errorIter(), options);

    return throwStream;
  }

  /**
   * Create Stream with isMemoryStream = true and isInfiniteStream=true to keep single value
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
    const options = {
      isMemoryStream: true,
      isInfiniteStream: true,
    };
    const valueStream = new Stream<T>([value], options);

    // assign Dummy Listener to start a stream
    valueStream.addListener(
      Stream.createListener({
        next: () => {
          return;
        },
      }),
    );

    return valueStream;
  }

  /**
   * Create Stream based on passed stream
   *
   */
  static fromStream<T>(stream: Stream<T>): Stream<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let outStream = <Stream<T>>(<any>null);

    const listener = {
      next: (value: T) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        outStream.next(value);
      },
      return: (value?: T) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        outStream.return(value);
      },
      throw: (err: unknown) => {
        outStream.throw(err);
      },
    };

    const options = {
      isMemoryStream: stream.options.isMemoryStream,
      isInfiniteStream: true,
    };
    outStream = new Stream<T>(getProducerFromStream(stream, listener), options);

    return outStream;
  }
  // Argument of type 'Listener<T> | { next: (value: T) => void; return: (value?: T | undefined) => void; throw: (err: unknown) => void; }' is not assignable to parameter of type 'Listener<T>'.
  // Type '{ next: (value: T) => void; return: (value?: T) => void; throw: (err: unknown) => void; }' is not assignable to type 'Listener<T>'.
  //   Types of property 'next' are incompatible.
  //     Type '(value: T) => void' is not assignable to type '((...args: [] | [unknown]) => IteratorResult<T | undefined, any>) | ((...args: [] | [unknown]) => Promise<IteratorResult<T | undefined, any>>)'.
  //       Type '(value: T) => void' is not assignable to type '(...args: [] | [unknown]) => IteratorResult<T | undefined, any>'.
  //         Type 'void' is not assignable to type 'IteratorResult<T | undefined, any>'.

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
    return new Stream<T>(items);
  }

  producer: Producer<T> | null;
  #producerIter: ProducerIterator<T> | null;
  protected listeners: Array<Listener<T>>;
  #stopID: NodeJS.Timeout | null;
  #err: unknown | null;
  protected lastValue: T | null;
  options: StreamOptions;

  constructor(
    producer?: Producer<T>,
    options: StreamOptions = {
      isMemoryStream: false,
      isInfiniteStream: false,
    },
  ) {
    this.producer = producer || null;
    this.#producerIter = null;
    this.listeners = [];
    this.#stopID = null;
    this.#err = null;
    this.options = options;
    this.lastValue = null;

    if (producer instanceof Stream) {
      return Stream.fromStream(producer);
    }
  }

  [Symbol.asyncIterator]() {
    return this;
  }

  // tear down logic, after error or complete
  #clearStream(): void {
    this.#err = null;
    this.listeners = [];
    this.lastValue = null;
    this.#producerIter = null;
  }

  // We can ask value only from memory stream
  getLastValue(): T | null {
    if (this.options.isMemoryStream) {
      return this.lastValue;
    }

    throw new Error('Not a memory stream');
  }

  // We can update value only in memory stream
  // It will immediately brodcast updated value
  updateLastValue(cb: (value: T | null) => T): void {
    if (this.options.isMemoryStream) {
      const res = cb(this.lastValue);
      this.lastValue = res;
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
    let isAsync = true;

    if (typeof producer[Symbol.asyncIterator] === 'function') {
      this.#producerIter = <AsyncIterator<T>>producer[Symbol.asyncIterator]();
    } else if (typeof producer[Symbol.iterator] === 'function') {
      this.#producerIter = <Iterator<T>>producer[Symbol.iterator]();
      isAsync = false;
    }

    let value: T | undefined;
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const res = <IteratorResult<T>>(isAsync
          ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            await this.#producerIter!.next()
          : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.#producerIter!.next());

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

    if (!this.options.isInfiniteStream) {
      this.return(value);
    }
  }

  // Stream itself is a AsyncIterator
  // It should implement next, return, throw methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async next(...values: [T | undefined]): Promise<IteratorResult<T | any>> {
    this.lastValue = values[values.length - 1] || null;
    for (const listener of this.listeners) {
      listener.next(...values);
    }
    return { done: false, value: this.lastValue };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async return(...values: [T | undefined]): Promise<IteratorResult<T | any>> {
    if (
      this.#producerIter !== null &&
      typeof this.#producerIter.return === 'function'
    ) {
      this.#producerIter.return(...values);
    }

    for (const listener of this.listeners) {
      listener.return(...values);
    }

    this.#clearStream();
    return { done: true, value: this.lastValue };
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

    for (const listener of this.listeners) {
      listener.throw(e);
    }

    this.#clearStream();
    return { done: true, value: undefined };
  }

  // Add a Listener to the Stream.
  addListener(listener: Listener<T>): void {
    if (this.options.isMemoryStream && this.lastValue !== null) {
      listener.next(this.lastValue);
    }

    this.listeners.push(listener);

    if (this.listeners.length === 1) {
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
    const i = this.listeners.indexOf(listener);
    if (i > -1) {
      this.listeners.splice(i, 1);
      // Stop producer if all listeners were removed
      // Do it in async way in case if user would like to remove one listener and immediately add another listener
      if (this.producer !== null && this.listeners.length === 0) {
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
    return take(num, this);
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
  map<R>(cb: (t: T) => R): Stream<R> {
    return map(cb, this);
  }
}
