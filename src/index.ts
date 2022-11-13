// export { default as Stream } from './streams/stream';

// import type { Listener } from './interfaces/listener';
import Stream from './streams/stream.js';
import { EventEmitter } from 'node:events';

const myEE = new EventEmitter();

async function* on(el: EventEmitter, event: string): AsyncGenerator<number> {
  const isIterate = true;
  let inc = 0;
  let cb: (() => void) | null;
  el.on(event, (e) => {
    if (cb != null) {
      cb();
      cb = null;
    }
  });

  while (isIterate) {
    if (inc === 3) {
      throw new Error('MY FAKE ERROR');
      return 6666;
    }
    yield new Promise<number>((resolve) => {
      inc++;
      // if (inc === 5) {
      //   isIterate = false;
      // }
      cb = () => resolve(inc);
    });
  }
}

const stream = new Stream<number>(on(myEE, 'click'));
setInterval(() => myEE.emit('click'), 2000);

//const stream = new Stream<number>([1, 2, 3, 4, 5]);

function createListener(listener: { next: any; return?: any; throw?: any }) {
  function* create(): Generator<any> {
    while (true) {
      const res = yield;
      listener.next(res);
    }
  }

  const generator = create();
  if (listener.return !== undefined) {
    generator.return = listener.return;
  }

  if (listener.throw !== undefined) {
    generator.throw = listener.throw;
  }

  generator.next();
  return generator;
}

const listenerConsole = {
  next: (val: unknown) => console.log('II', val),
  return: (val?: unknown) => console.log('II COMPLETE', val),
  throw: (err: unknown) => console.log('II ERROR:', err),
};

const listener = createListener(listenerConsole);

const listenerConsole2 = {
  next: (val: unknown) => console.log('BLA BLA', val),
  return: () => console.log('BLA COMPLETE'),
  throw: (err: unknown) => console.log('BLA ERROR:', err),
};

const listener2 = createListener(listenerConsole2);

const streamListener2 = new Stream<number>();
streamListener2.addListener(listener2);

stream.addListener(listener);
stream.addListener(streamListener2);

// const producer = {
//   id: 0,

//   start: function (listener: Listener<string>) {
//     let num = 0;
//     this.id = setInterval(() => {
//       num += 1;
//       listener.next(`yo ${num}`);
//     }, 2000)[Symbol.toPrimitive]();
//   },

//   stop: function () {
//     clearInterval(this.id);
//   },
// };

// const stream = xs.create(producer);
// stream.addListener({ next: (val) => console.log('first', val) });
// stream.addListener({ next: (val) => console.log('second', val) });

// setTimeout(() => {
//   stream.addListener({ next: (val) => console.log('third', val) });
// }, 4000);

// const streamComplete = rs.empty();

// const listenerConsole = {
//   next: (val: unknown) => console.log('II', val),
//   complete: () => console.log('COMPLETE'),
//   error: (err: unknown) => console.error(err),
// };

// streamComplete.addListener(listenerConsole);

// const streamError = rs.throw('My Error');
// streamError.addListener(listenerConsole);

// const streamArray = rs.fromIterable(['a', 'b', 'c', 'd']);
// streamArray.addListener(listenerConsole);

// const streamOf = rs.of('aa', 'bb', 'cc', 'dd');
// streamOf.addListener(listenerConsole);

// const streamNever = rs.never();
// streamNever.addListener(listenerConsole);

// stream.addListener(streamNever);

// const takeStream = stream.take(5);

// takeStream.addListener(listenerConsole);

// const a$ = xs.fromValue<number>(1);
// const b$ = xs.fromValue<number>(2);
// const c$ = xs.toMemoryStream(xs.combine(a$, b$, takeStream));
// c$.addListener(listenerConsole);

// setTimeout(() => {
//   b$.updateLastValue(() => 3);
// }, 12000);

// const mapStream = c$.map(([valA, valB, valC]) => {
//   console.log('mapStream C:', valC);
//   return valA + valB;
// });

// const mapListenerConsole = {
//   next: (val: unknown) => console.log('map:', val),
//   complete: () => console.log('map COMPLETE'),
//   error: (err: unknown) => console.error(err),
// };

// mapStream.addListener(mapListenerConsole);

// console.log('GET map last value:', mapStream.getLastValue());
// b$.updateLastValue(() => 4);
// console.log('GET map last value:', mapStream.getLastValue());
