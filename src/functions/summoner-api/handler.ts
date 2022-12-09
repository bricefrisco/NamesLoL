import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Region } from '@libs/types/region';
import { badRequest, error, notFound, summonerApiResponse, warmUp } from '@libs/responses';
import { getValidRegions, nameIsValid, regionIsValid } from '@libs/validation';
import { fetchSummoner } from '@libs/riotApi';
import { mapSummoner } from '@libs/mapper';
import { RiotResponse } from '@libs/types/riotResponse';
import { SummonerEntity } from '@libs/types/summonerEntity';
import { updateSummoner } from '@libs/dynamoDB';

export const main = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  console.log(JSON.stringify(event));

  if (!process.env.RIOT_API_TOKEN) {
    throw new Error('RIOT_API_TOKEN environment variable must be set!');
  }

  if (event.body === 'serverless-warmer') {
    return warmUp('Function is warm.');
  }

  // Request validation
  const regionStr: string | undefined = event.pathParameters?.region?.toLowerCase();
  if (!regionStr || !regionIsValid(regionStr)) {
    return badRequest(`Invalid region. Use one of: ${getValidRegions()}`);
  }

  const region: Region = Region[regionStr.toUpperCase() as keyof typeof Region];

  const name: string | undefined = event.pathParameters?.name?.toLowerCase();
  if (!name || !nameIsValid(name)) {
    return badRequest('Name must be at least three characters long.');
  }

  try {
    // Fetch summoner name from Riot API
    const response: RiotResponse = await fetchSummoner(name, region, process.env.RIOT_API_TOKEN);

    // Save summoner in DynamoDB
    const summoner: SummonerEntity = mapSummoner(response, region);
    await updateSummoner(summoner);

    return summonerApiResponse(summoner);
  } catch (e) {
    if (e.message?.includes('summoner not found')) {
      return notFound(`Summoner by name ${name} was not found`);
    }

    console.error(e);
    return error(e.message || 'Internal server error.');
  }
};
