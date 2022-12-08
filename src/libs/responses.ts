import { APIGatewayProxyResult } from 'aws-lambda';
import { SummonerEntity } from './types/summonerEntity';

if (!process.env.CORS_SITES || !process.env.CORS_METHODS) {
  throw new Error('CORS_SITES and CORS_METHODS environment variables must be set!');
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.CORS_SITES,
  'Access-Control-Allow-Methods': process.env.CORS_METHODS
};

const log = (traceId: string, statusCode: number, message?: string) => {
  const jsonLog = JSON.stringify({ traceId, statusCode, message });

  if (statusCode === 500) {
    console.error(jsonLog);
  } else if (statusCode === 200) {
    console.log(jsonLog);
  } else {
    console.warn(jsonLog);
  }
};

export const warmUp = (traceId: string, message: string): APIGatewayProxyResult => {
  log(traceId, 200);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(message)
  };
};

export const badRequest = (traceId: string, error: string): APIGatewayProxyResult => {
  log(traceId, 400, error);

  return {
    statusCode: 400,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error })
  };
};

export const notFound = (traceId: string, message: string): APIGatewayProxyResult => {
  log(traceId, 404, message);

  return {
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({ message })
  };
};

export const error = (traceId: string, error: string): APIGatewayProxyResult => {
  log(traceId, 500, error);

  return {
    statusCode: 500,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error })
  };
};

export const summonerApiResponse = (
  traceId: string,
  summoner: SummonerEntity
): APIGatewayProxyResult => {
  log(traceId, 200);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(summoner)
  };
};

export const summonersApiResponse = (
  traceId: string,
  summoners: SummonerEntity[]
): APIGatewayProxyResult => {
  log(traceId, 200);

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
