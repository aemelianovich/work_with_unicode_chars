import { Stream as xs } from '../dist/index.js';

const a = xs.fromValue(1);
const b = xs.fromValue(2);
const c = xs.combine(a, b);
const d = xs.toValue(c.map(([aValue, bValue]) => aValue + bValue + 5));

console.log('a:', a.getLastValue()); // 1
console.log('b:', b.getLastValue()); // 2

console.log('d:', d.getLastValue()); // 8

a.updateLastValue((val) => val + 10);

console.log('a:', a.getLastValue()); // 11
console.log('b:', b.getLastValue()); // 2
console.log('d:', d.getLastValue()); // 18

try {
  c.getLastValue();
} catch (err) {
  console.error(err); // Exception
}
