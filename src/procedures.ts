import { camelCase } from "lodash";

/**
 * Fix/convert "" key prop (-> "id") representing the Index count for every object within the array
 * @param object data - array object
 */
export const fixIndex = (data: any) => {
  const length = data.length;
  let edited: object[] = [];
  for (let i = 0; i < length; i++) {
    const { "": id, ...rest } = data[i];
    edited = [...edited, convertKeysToCamelCase({ id, ...rest })];
  }
  return edited;
};

/**
 * Convert prop keys to camelCase.
 * @param object data - single object containing generic feature props comprised of stock data
 */
export const convertKeysToCamelCase = (data: any) => {
  let edited = {};
  for (let key in data) {
    let newKey = camelCase(key);
    let value = data[key];
    edited = { ...edited, [newKey]: value };
  }
  return edited;
};

/**
 * Merge 'gicsSector' & 'gicsSubIndustry' props from securities dataset to fundamentals dataset;
 * @param object fundamentals - fundamentals data object.
 * @param object securities  - securities data object
 */
export const mergeFromSecurities = (securities: any) => (currentData: any) => {
  const result = currentData.map((o: any) => {
    let { gicsSector, gicsSubIndustry } = securities.find(
      (e: any) => e.tickerSymbol === o.tickerSymbol
    );
    return { ...o, gicsSector, gicsSubIndustry };
  });
  return result;
};

/**
 * Compute an average value for a set of 'ratio' values given a 'periodEnding' & a 'gicsSubSector' properties
 * present on every combined-fundamentals object;
 * @param fundamentals - combined fundamentals object
 * @param ratio - the ratio prop present on every fundamentals object - ex: 'currentRatio'
 * @param gicsSubIndustry - subIndustry for classification - ex: 'Pharmaceuticals'
 * @param period - the periodEnding prop - ex: '2012-12-31'
 */
export const makeAverage = (
  fundamentals: any,
  ratio: string,
  gicsSubIndustry: string,
  period: string
) => {
  let result;
  result = fundamentals.reduce(
    (acc: any, curr: any) => {
      if (
        curr.gicsSubIndustry === gicsSubIndustry &&
        curr.periodEnding === period
      ) {
        return {
          ...acc,
          count: acc.count + 1,
          values: [...acc.values, curr[ratio]],
          average:
            [...acc.values, curr[ratio]].reduce((a, c) => a + c, 0) /
            (acc.count + 1),
        };
      }
      return acc;
    },
    {
      ratio,
      count: 0,
      values: [],
      average: 0,
    }
  );

  return result;
};

export const filterNull = (prop: string) => (data: any) => 
  data.filter((el: any) => el[prop] !== null);

export const filterSingles = (prop: string) => (data: any) =>
  data.filter((el: any) => el[prop].length >= 2 );