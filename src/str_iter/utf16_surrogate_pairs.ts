// https://en.wikipedia.org/wiki/UTF-16
// UTF-16 surrogate pairs low and high range in UTF-16BE decimal format
type pairs = {
  low: { min: number; max: number };
  high: { min: number; max: number };
};
const surrogatePairsMap: pairs = {
  low: { min: 56320, max: 57343 },
  high: { min: 55296, max: 56319 },
};

export default surrogatePairsMap;
