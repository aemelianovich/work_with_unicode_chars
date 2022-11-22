// https://unicode-table.com/en/
// Unicode min and max numeral codes in UTF-16BE decimal format
type numeralMap = {
  [key: string]: { min: number; max: number }[];
};
const alphabetNumeralMap: numeralMap = {
  latin: [{ min: 48, max: 57 }],
  roman: [
    { min: 8544, max: 8559 },
    { min: 8576, max: 8578 },
  ],
};

export default alphabetNumeralMap;
