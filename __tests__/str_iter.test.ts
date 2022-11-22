import { getStrIter } from '../src/index';

describe('Check str iterator', () => {
  test('Check string with surrogate pairs', () => {
    expect([...getStrIter('amd😀3452🧓1v🇦🇩😀')]).toEqual([
      'a',
      'm',
      'd',
      '😀',
      '3',
      '4',
      '5',
      '2',
      '🧓',
      '1',
      'v',
      '🇦',
      '🇩',
      '😀',
    ]);
  });
});
