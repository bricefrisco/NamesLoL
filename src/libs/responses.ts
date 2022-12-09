import { APIGatewayProxyResult } from 'aws-lambda';
import { SummonerEntity } from './types/summonerEntity';

if (!process.env.CORS_SITES || !process.env.CORS_METHODS) {
  throw new Error('CORS_SITES and CORS_METHODS environment variables must be set!');
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.CORS_SITES,
  'Access-Control-Allow-Methods': process.env.CORS_METHODS
};

const log = (statusCode: number, message?: string) => {
  const jsonLog = JSON.stringify({ statusCode, message });

  if (statusCode >= 500) {
    console.error(jsonLog);
  } else if (statusCode >= 200 && statusCode < 300) {
    console.log(jsonLog);
  } else {
    console.warn(jsonLog);
  }
};

export const warmUp = (message: string): APIGatewayProxyResult => {
  log(200);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(message)
  };
};

export const badRequest = (error: string): APIGatewayProxyResult => {
  log(400, error);

  return {
    statusCode: 400,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error })
  };
};

export const notFound = (message: string): APIGatewayProxyResult => {
  log(404, message);

  return {
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({ message })
  };
};

export const error = (error: string): APIGatewayProxyResult => {
  log(500, error);

  return {
    statusCode: 500,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error })
  };
};

export const summonerApiResponse = (summoner: SummonerEntity): APIGatewayProxyResult => {
  log(200);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(summoner)
  };
};

export const summonersApiResponse = (summoners: SummonerEntity[]): APIGatewayProxyResult => {
  log(200);

  const earliestAvailabilityDate: number | null =
    summoners?.length > 0 ? summoners[0].availabilityDate : null;

  const latestAvailabilityDate: number | null =
    summoners?.length > 0 ? summoners[summoners.length - 1].availabilityDate : null;

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      summoners,
      backwards: earliestAvailabilityDate,
      forwards: latestAvailabilityDate
    })
  };
};
