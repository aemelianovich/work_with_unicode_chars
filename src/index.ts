// export { default as Stream } from './streams/stream';

// import type { Listener } from './interfaces/listener';
import Stream from './streams/stream.js';
import { EventEmitter } from 'node:events';

// Check Event Stream
const myEE = new EventEmitter();

async function* on(el: EventEmitter, event: string): AsyncGenerator<number> {
  const isIterate = true;
  let inc = 0;
  let cb: (() => void) | null;
  el.on(event, () => {
    if (cb != null) {
      cb();
      cb = null;
    }
  });

  while (isIterate) {
    if (inc === 8) {
      //throw new Error('MY FAKE ERROR');
      return 6666;
    }
    yield new Promise<number>((resolve) => {
      inc++;
      cb = () => resolve(inc);
    });
  }
}

const stream = new Stream<number>(on(myEE, 'click'));
setInterval(() => myEE.emit('click'), 2000);

const listenerConsole = {
  next: (val: number) => console.log('II', val),
  return: (val?: number) => console.log('II COMPLETE', val),
  throw: (err: unknown) => console.log('II ERROR:', err),
};

const listener = Stream.createListener(listenerConsole);

const listenerConsole2 = {
  next: (val: number) => console.log('BLA BLA', val),
  return: () => console.log('BLA COMPLETE'),
  throw: (err: unknown) => console.log('BLA ERROR:', err),
};

const listener2 = Stream.createListener(listenerConsole2);

const streamListener2 = new Stream<number>();
streamListener2.addListener(listener2);

stream.addListener(listener);
stream.addListener(streamListener2);

const listenerConsole3 = {
  next: (val: number) => console.log('3LIST', val),
  return: (val?: number) => console.log('3LIST COMPLETE', val),
  throw: (err: unknown) => console.log('3LIST ERROR:', err),
};

const listener3 = Stream.createListener(listenerConsole3);
setTimeout(() => stream.addListener(listener3), 6000);
setTimeout(() => stream.removeListener(listener3), 12000);
console.log('-------');

//
//
// Check Value Stream
const a = Stream.fromValue(1);
const b = Stream.fromValue(2);
//const c = Stream.combine(a, b);
//const d = Stream.toValue(c.map(([aValue, bValue]) => aValue + bValue + 5));

console.log('a:', a.getLastValue()); // 1
console.log('b:', b.getLastValue()); // 2
console.log('-------');

//
//
// Check Complete Stream
const completeConsole = {
  next: () => console.log('Empty Stream next'),
  return: () => console.log('Empty Stream COMPLETE'),
  throw: (err: unknown) => console.log('Empty Stream ERROR:', err),
};

const streamComplete = Stream.empty();
streamComplete.addListener(Stream.createListener(completeConsole));
console.log('-------');

//
//
// Check Error Stream
const errorConsole = {
  next: () => console.log('Error Stream next'),
  return: () => console.log('Error Stream COMPLETE'),
  throw: (err: unknown) => console.log('Error Stream ERROR:', err),
};

const streamError = Stream.throw('My ERROR stream check');
streamError.addListener(Stream.createListener(errorConsole));
console.log('-------');

//
//
// Check Never Stream
const neverConsole = {
  next: () => console.log('Never Stream next'),
  return: () => console.log('Never Stream COMPLETE'),
  throw: (err: unknown) => console.log('Never Stream ERROR:', err),
};

const neverListener = Stream.createListener(neverConsole);
const neverStream = Stream.never();
neverStream.addListener(neverListener);
console.log('------Never------');
setTimeout(() => {
  neverStream.removeListener(neverListener);
}, 2000);
console.log('-------');

//
//
// Check Of Stream
const ofConsole = {
  next: (val: number) => console.log('Of Stream next', val),
  return: () => console.log('Of Stream COMPLETE'),
  throw: (err: unknown) => console.log('Of Stream ERROR:', err),
};

const streamOF = Stream.of<number>(1, 2, 3);
streamOF.addListener(Stream.createListener(ofConsole));
console.log('-------');

//
//
// Check Map Stream
const MapConsole = {
  next: (val: number) => console.log('Map Stream next', val),
  return: (val?: number) => console.log('Map Stream COMPLETE', val),
  throw: (err: unknown) => console.log('Map Stream ERROR:', err),
};

const mapStream = stream.map((val) => val * 10);
mapStream.addListener(Stream.createListener(MapConsole));

//
//
// Check Take Stream
const TakeConsole = {
  next: (val: number) => console.log('Take Stream next', val),
  return: (val?: number) => console.log('Take Stream COMPLETE', val),
  throw: (err: unknown) => console.log('Take Stream ERROR:', err),
};

const takeStream = stream.map((val) => val * 10).take(5);
takeStream.addListener(Stream.createListener(TakeConsole));
console.log('instanceof', stream instanceof Stream);
