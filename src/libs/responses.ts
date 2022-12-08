import { APIGatewayProxyResult } from 'aws-lambda';

export const warmUp = (message: string): APIGatewayProxyResult => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_SITES,
      'Access-Control-Allow-Methods': process.env.CORS_METHODS,
    },
    body: JSON.stringify(message),
  };
};

export const badRequest = (error: string): APIGatewayProxyResult => {
  return {
    statusCode: 400,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_SITES,
      'Access-Control-Allow-Methods': process.env.CORS_METHODS,
    },
    body: JSON.stringify({ error }),
  };
};

export const notFound = (message: string): APIGatewayProxyResult => {
  return {
    statusCode: 404,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_SITES,
      'Access-Control-Allow-Methods': process.env.CORS_METHODS,
    },
    body: JSON.stringify({ message }),
  };
};

export const error = (error: string): APIGatewayProxyResult => {
  return {
    statusCode: 500,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_SITES,
      'Access-Control-Allow-Methods': process.env.CORS_METHODS,
    },
    body: JSON.stringify({ error }),
  };
};
