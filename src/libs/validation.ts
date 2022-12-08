import { Region } from '@libs/types/region';

const regions: string[] = Object.values(Region).map((r) => r.toLowerCase());

export const regionIsValid = (region: string): boolean => {
  return regions.includes(region);
};

export const getValidRegions = (): string[] => {
  return regions;
};

export const nameIsValid = (name: string): boolean => {
  return name?.length >= 3;
};

export const parseTimestamp = (timestamp: string): number => {
  if (timestamp == null) {
    throw new Error('Timestamp cannot be null. Example: /{region}/summoners?timestamp=12345');
  }

  let parsedTimestamp: number;

  try {
    parsedTimestamp = parseInt(timestamp);
  } catch (e) {
    throw new Error(
      'Could not parse timestamp. Please include numbers only. Example: /{region}/summoners?timestamp=12345',
    );
  }

  if (parsedTimestamp < 1) {
    throw new Error('Timestamp cannot be less than 1.');
  }

  return parsedTimestamp;
};

export const parseNameLength = (nameLength: string): number => {
  if (nameLength == null) return null;

  let parsedNameLength: number;
  try {
    parsedNameLength = parseInt(nameLength);
  } catch (e) {
    throw new Error('Could not parse name length. Please include a number between 3 and 16');
  }

  if (parsedNameLength < 3) {
    throw new Error('nameLength cannot be less than 3.');
  }

  if (parsedNameLength > 16) {
    throw new Error('nameLength cannot be greater than 16.');
  }

  return parsedNameLength;
};
