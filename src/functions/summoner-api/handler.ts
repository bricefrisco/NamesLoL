import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Region } from '@libs/types/region';
import { badRequest, error, notFound, warmUp } from '@libs/responses';
import { getValidRegions, nameIsValid, regionIsValid } from '@libs/validation';
import { fetchSummoner } from '@libs/riotApi';
import { mapSummoner } from '@libs/mapper';
import { RiotResponse } from '@libs/types/riotResponse';
import { SummonerEntity } from '@libs/types/summonerEntity';
import { updateSummoner } from '@libs/dynamoDB';

const mapResponse = (summoner: SummonerEntity): APIGatewayProxyResult => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_SITES,
      'Access-Control-Allow-Methods': process.env.CORS_METHODS,
    },
    body: JSON.stringify(summoner),
  };
};

export const main = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  if (event.body === 'serverless-warmer') {
    console.log('Function is warm!');
    return warmUp('Function is warm.');
  }

  // Request validation
  const regionStr: string = event.pathParameters?.region?.toLowerCase();
  if (!regionIsValid(regionStr)) {
    return badRequest(`Invalid region. Use one of: ${getValidRegions()}`);
  }

  const region: Region = Region[regionStr.toUpperCase() as keyof typeof Region];

  const name: string = event.pathParameters?.name?.toLowerCase();
  if (!nameIsValid(name)) {
    return badRequest('Name must be at least three characters long.');
  }

  try {
    // Fetch summoner name from Riot API
    const response: RiotResponse = await fetchSummoner(name, region, process.env.RIOT_API_TOKEN);

    // Save summoner in DynamoDB
    const summoner: SummonerEntity = mapSummoner(response, region);
    await updateSummoner(summoner);

    return mapResponse(summoner);
  } catch (e) {
    if (e.message?.includes('summoner not found')) {
      return notFound(`Summoner by name ${name} was not found`);
    }

    console.error(e);
    return error(e.message || 'Internal server error.');
  }
};
