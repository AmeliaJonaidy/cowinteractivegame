// Configurable by Benel/Leroy — single source of truth for scoring
export const conversionRates = {
  normalCow: 1,
  fuel: 5,
  wagyuCow: 25,
};

export function calcTotal(school, rates = conversionRates) {
  return (
    (Number(school.normalCows) || 0) * (Number(rates.normalCow) || 0) +
    (Number(school.parts) || 0) * (Number(rates.fuel ?? rates.part) || 0) +
    (Number(school.wagyuCows) || 0) * (Number(rates.wagyuCow) || 0)
  );
}
