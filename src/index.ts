// export { default as Stream } from './streams/stream';

// import type { Listener } from './interfaces/listener';
import Stream from './streams/stream.js';
// import { EventEmitter } from 'node:events';

//
//
//
const stream = new Stream<number>([1, 2, 3, 4, 5, 6]);

(async () => {
  for await (const value of stream) {
    console.log('Stream 1:', value);
  }
})();

(async () => {
  for await (const value of stream) {
    console.log('Stream 2:', value);
  }
})();

//
//
//
const takeStream = new Stream<number>([1, 2, 3, 4, 5, 6]).take(4);
(async () => {
  for await (const value of takeStream) {
    console.log('Take Stream 1:', value);
  }
})();

(async () => {
  for await (const value of takeStream) {
    console.log('Take Stream 2:', value);
  }
})();

//
//
//
const mapStream = new Stream<number>([1, 2, 3, 4, 5, 6])
  .take(3)
  .map((val) => val * 10);

(async () => {
  for await (const value of mapStream) {
    console.log('Map Stream 1:', value);
  }
})();

(async () => {
  for await (const value of mapStream) {
    console.log('Map Stream 2:', value);
  }
})();

//
//
//
const combineStream = Stream.combine(mapStream, stream, takeStream);

(async () => {
  for await (const value of combineStream) {
    console.log('Combine Stream 1:', value);
  }
})();

(async () => {
  for await (const value of combineStream) {
    console.log('Combine Stream 2:', value);
  }
})();

//
//
//
const a = Stream.fromValue<number>(3);

(async () => {
  for await (const value of a) {
    console.log('a1:', value);
  }
})();

(async () => {
  for await (const value of a) {
    console.log('a2:', value);
  }
})();

a.updateValue((val) => val + 10);

(async () => {
  for await (const value of a) {
    console.log('a1:', value);
  }
})();

(async () => {
  for await (const value of a) {
    console.log('a2:', value);
  }
})();

//
//
//
const ea = Stream.fromValue<number>(1),
  eb = Stream.fromValue<number>(2),
  ec = Stream.combine(ea, eb),
  ed = ec.map(([aValue, bValue]) => aValue + bValue + 5);

(async () => {
  console.log('ea', ea.getValue());
})();

(async () => {
  console.log('eb', await eb.getValue());
})();

(async () => {
  console.log('ec', await ec.getValue());
})();

(async () => {
  console.log('ed', await ed.getValue());
})();

(async () => {
  for await (const value of ed) {
    console.log('ed1:', value);
  }
})();

ea.updateValue((val) => val + 10);

(async () => {
  console.log('ea', await ea.getValue());
})();

(async () => {
  console.log('eb', await eb.getValue());
})();

(async () => {
  console.log('ec', await ec.getValue());
})();

(async () => {
  console.log('ed', await ed.getValue());
})();

(async () => {
  for await (const value of ed) {
    console.log('ed2:', value);
  }
})();
