import alphabetNumeralMap from './alphabet_numerals';

const getAlphabet = (char: string): string => {
  const code = char.charCodeAt(0);
  const alphabet = Object.keys(alphabetNumeralMap).filter((key) => {
    for (const range of alphabetNumeralMap[key]) {
      if (range.min <= code && code <= range.max) {
        return true;
      }
    }

    return false;
  });

  return alphabet[0];
};

const isNumber = (str: string): boolean => {
  if (str.length === 0 || (str.length > 1 && str[0] === '0')) {
    return false;
  }

  // Get alphabet by first character
  const alphabet = getAlphabet(str[0]);

  if (alphabet === undefined) {
    return false;
  }

  // Check that each char of string match to the range of values for appropriate alphabet
  for (const char of str) {
    const code = char.charCodeAt(0);
    let isMatched = false;
    for (const range of alphabetNumeralMap[alphabet]) {
      if (range.min <= code && code <= range.max) {
        isMatched = true;
      }
    }

    if (!isMatched) {
      return false;
    }
  }

  return true;
};

export default isNumber;
