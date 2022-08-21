import { Region } from '@libs/types/region';
import { badRequest } from '@libs/responses';

const regions: string[] = Object.values(Region).map((r) => r.toLowerCase());

export const validateRegion = (region: string) => {
  if (!regions.includes(region)) {
    return badRequest(
      `Invalid region '${region}'. Correct path is /{region}/summoners, with one of these regions: ${regions.join(
        ', ',
      )}`,
    );
  }
};

export const validateName = (name: string) => {
  if (name == null) {
    throw new Error('Name cannot be empty. Example: /{region}/summoner/{name}');
  }

  if (name.length < 3) throw new Error('Name length cannot be less than 3');
};

export const parseTimestamp = (timestamp: string): number => {
  if (timestamp == null) {
    throw new Error(
      'Timestamp cannot be null. Example: /{region}/summoners?timestamp=12345',
    );
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
    throw new Error(
      'Could not parse name length. Please include a number between 3 and 16',
    );
  }

  if (parsedNameLength < 3) {
    throw new Error('nameLength cannot be less than 3.');
  }

  if (parsedNameLength > 16) {
    throw new Error('nameLength cannot be greater than 16.');
  }

  return parsedNameLength;
};
