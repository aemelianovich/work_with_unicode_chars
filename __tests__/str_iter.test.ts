import { getStrIter } from '../src/index';

describe('Check str iterator', () => {
  test('Check string with surrogate pairs', () => {
    expect([...getStrIter('amdð3452ð§1vð¦ð©ð')]).toEqual([
      'a',
      'm',
      'd',
      'ð',
      '3',
      '4',
      '5',
      '2',
      'ð§',
      '1',
      'v',
      'ð¦',
      'ð©',
      'ð',
    ]);
  });
});
