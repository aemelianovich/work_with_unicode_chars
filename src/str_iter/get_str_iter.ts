import surrogatePairsMap from './utf16_surrogate_pairs';

// Surrogate Pair=(High Surrogate)(Low Surrogate)
// S=HL

const getStrIter = function* (str: string): Generator<string> {
  const nStr = str.normalize();

  for (let i = 0; i < nStr.length; i++) {
    const res = [];
    let code = nStr[i].charCodeAt(0);

    // check high surrogate pair
    if (
      surrogatePairsMap.high.min <= code &&
      code <= surrogatePairsMap.high.max
    ) {
      res.push(nStr[i]);
      i++;
      code = nStr[i].charCodeAt(0);
      // check low surrogate pair
      if (
        surrogatePairsMap.low.min <= code &&
        code <= surrogatePairsMap.low.max
      ) {
        res.push(nStr[i]);
      } else {
        throw new Error('Invalid string - unpaired surrogate detected');
      }
    } else {
      res.push(nStr[i]);
    }

    yield res.join('');
  }
};

export default getStrIter;
