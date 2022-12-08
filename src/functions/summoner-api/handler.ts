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
  const traceId = event.headers['X-Amzn-Trace-Id'];
  console.log(JSON.stringify({ traceId, event }));

  if (event.body === 'serverless-warmer') {
    return warmUp(traceId, 'Function is warm.');
  }

  // Request validation
  const regionStr: string = event.pathParameters?.region?.toLowerCase();
  if (!regionIsValid(regionStr)) {
    return badRequest(traceId, `Invalid region. Use one of: ${getValidRegions()}`);
  }

  const region: Region = Region[regionStr.toUpperCase() as keyof typeof Region];

  const name: string = event.pathParameters?.name?.toLowerCase();
  if (!nameIsValid(name)) {
    return badRequest(traceId, 'Name must be at least three characters long.');
  }

  try {
    // Fetch summoner name from Riot API
    const response: RiotResponse = await fetchSummoner(name, region, process.env.RIOT_API_TOKEN);

    // Save summoner in DynamoDB
    const summoner: SummonerEntity = mapSummoner(response, region);
    await updateSummoner(summoner);

    return summonerApiResponse(traceId, summoner);
  } catch (e) {
    if (e.message?.includes('summoner not found')) {
      return notFound(traceId, `Summoner by name ${name} was not found`);
    }

    console.error(e);
    return error(traceId, e.message || 'Internal server error.');
  }
};
