export { default as Stream } from './streams/stream';

// import type { Listener } from './interfaces/listener';
// import xs from './streams/stream';

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
