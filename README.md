# Work with unicode chars

Implementation of different use cases that needs to work with unicode chars

## isNumber advanced method

Check whether passed string is number or not.
Can support different alphabets, e.g. Latin and Roman alphabets(Easy to extend).
Numbers from different alphabets treated as not a number.

```js
import isNumber from './src';

console.log(isNumber('1234567890')); // true
console.log(isNumber('ⅯⅩⅧ')); // true
console.log(isNumber('ⅯⅩⅧ12')); // false
```

## strIter mimic native string iterator

Custom string iterator that mimics the native string iterator,
It should properly works with surrogate pairs in the UTF-16 encoding.

```js
import getStrIter from './src';

console.log([...getStrIter('amd😀3452🧓1v🇦🇩😀')]); // ['a', 'm', 'd', '😀', '3', '4', '5','2', '🧓', '1', 'v', '🇦', '🇩', '😀']
```
