import * as cities from 'cities.json';
import { UserInfoFlowType } from './common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Fuse = require('fuse.js');

export const findCity = (input: string): string[] | string => {
  const lowercaseInput = input.toLowerCase().trim();

  interface City {
    name: string;
    country: string;
  }

  const exactMatch = (cities as City[]).find(
    (city) => city.name.toLowerCase() === lowercaseInput,
  );

  if (exactMatch) {
    return input;
  }

  const options = {
    keys: ['name'],
    threshold: 0.6,
    includeScore: true,
  };

  const fuse = new Fuse(cities as City[], options);
  console.log('fuse : ', fuse);
  const results = fuse.search(input);

  return results
    .sort((a, b) => (a.score || 1) - (b.score || 1))
    .slice(0, 5)
    .map((result) => result.item.name);
};

export const isUserInfoFlowType = (
  value: string,
): value is UserInfoFlowType => {
  return value === 'registration' || value === 'resubmit';
};

export const tryCatchPrismaWrapper = async <T>(
  arg: any,
  alternative: any,
): Promise<T> => {
  let result: T;
  try {
    result = await arg;
  } catch (err) {
    return alternative;
  }

  return result;
};
