import { getStrIter } from '../src/index';

describe('Check str iterator', () => {
  test('Check string with surrogate pairs', () => {
    expect([...getStrIter('wd😀2🧓1🇦🇩')]).toEqual([
      'w',
      'd',
      '😀',
      '2',
      '🧓',
      '1',
      '🇦',
      '🇩',
    ]);
  });
});
