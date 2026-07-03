// Configurable by Benel/Leroy — single source of truth for scoring
export const conversionRates = {
  normalCow: 10,
  wagyuCow: 50,
  part: 2,
};

export function calcTotal(school, rates = conversionRates) {
  return (
    school.normalCows * rates.normalCow +
    school.wagyuCows * rates.wagyuCow +
    school.parts * rates.part
  );
}