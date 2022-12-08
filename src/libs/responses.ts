import { APIGatewayProxyResult } from 'aws-lambda';
import { SummonerEntity } from './types/summonerEntity';

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
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_SITES,
      'Access-Control-Allow-Methods': process.env.CORS_METHODS,
    },
    body: JSON.stringify(message),
  };
};

export const badRequest = (traceId: string, error: string): APIGatewayProxyResult => {
  log(traceId, 400, error);

  return {
    statusCode: 400,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_SITES,
      'Access-Control-Allow-Methods': process.env.CORS_METHODS,
    },
    body: JSON.stringify({ error }),
  };
};

export const notFound = (traceId: string, message: string): APIGatewayProxyResult => {
  log(traceId, 404, message);

  return {
    statusCode: 404,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_SITES,
      'Access-Control-Allow-Methods': process.env.CORS_METHODS,
    },
    body: JSON.stringify({ message }),
  };
};

export const error = (traceId: string, error: string): APIGatewayProxyResult => {
  log(traceId, 500, error);

  return {
    statusCode: 500,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_SITES,
      'Access-Control-Allow-Methods': process.env.CORS_METHODS,
    },
    body: JSON.stringify({ error }),
  };
};

export const summonerApiResponse = (
  traceId: string,
  summoner: SummonerEntity,
): APIGatewayProxyResult => {
  log(traceId, 200);

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_SITES,
      'Access-Control-Allow-Methods': process.env.CORS_METHODS,
    },
    body: JSON.stringify(summoner),
  };
};

export const summonersApiResponse = (
  traceId: string,
  summoners: SummonerEntity[],
): APIGatewayProxyResult => {
  log(traceId, 200);

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_SITES,
      'Access-Control-Allow-Methods': process.env.CORS_METHODS,
    },
    body: JSON.stringify({
      summoners,
      forwards: summoners?.length > 0 && summoners[summoners.length - 1].availabilityDate,
      backwards: summoners?.length > 0 && summoners[0].availabilityDate,
    }),
  };
};
