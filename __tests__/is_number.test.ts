import { isNumber } from '../src/index';

describe('Check isNumber function', () => {
  test('Check latin alphabet - correct value', () => {
    expect(isNumber('1234567890')).toBeTruthy();
  });

  test('Check latin alphabet - incorrect value', () => {
    expect(isNumber('123a567890')).toBeFalsy();
  });

  test('Check roman alphabet - correct value', () => {
    expect(isNumber('ⅯⅩⅧ')).toBeTruthy();
  });

  test('Check roman alphabet - incorrect value', () => {
    expect(isNumber('ⅧⅯⅩↈ')).toBeFalsy();
  });

  test('Check mixed alphabet - incorrect value', () => {
    expect(isNumber('12ⅯⅩⅧ')).toBeFalsy();
  });
});
