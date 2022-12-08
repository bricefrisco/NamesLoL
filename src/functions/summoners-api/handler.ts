import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Region } from '@libs/types/region';
import { querySummoners, querySummonersByNameSize } from '@libs/dynamoDB';
import { mapDynamoSummoner } from '@libs/mapper';
import { SummonerEntity } from '@libs/types/summonerEntity';
import { badRequest, error, summonersApiResponse, warmUp } from '@libs/responses';
import { getValidRegions, parseNameLength, parseTimestamp, regionIsValid } from '@libs/validation';
import { AttributeValue, QueryCommandOutput } from '@aws-sdk/client-dynamodb';

export const main = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  const traceId = event.headers['X-Amzn-Trace-Id'];
  console.log(JSON.stringify({ traceId, event }));

  if (!traceId) {
    throw new Error('Request must have a traceId.');
  }

  if (event.body === 'serverless-warmer') {
    return warmUp(traceId, 'Function is warm.');
  }

  // Request validation
  const regionStr: string | undefined = event.pathParameters?.region?.toLowerCase();
  if (!regionStr || !regionIsValid(regionStr)) {
    return badRequest(traceId, `Invalid region. Use one of: ${getValidRegions()}`);
  }

  const region: Region = Region[regionStr.toUpperCase() as keyof typeof Region];

  let timestamp: number;
  try {
    timestamp = parseTimestamp(event.queryStringParameters?.timestamp);
  } catch (e) {
    return badRequest(traceId, e.message);
  }

  let nameLength: number | null;
  try {
    nameLength = parseNameLength(event.queryStringParameters?.nameLength);
  } catch (e) {
    return badRequest(traceId, e.message);
  }

  const backwards = event.queryStringParameters?.backwards === 'true';

  // Fetch names from DynamoDB
  try {
    let queryOutput: QueryCommandOutput;
    if (nameLength) {
      queryOutput = await querySummonersByNameSize(region, timestamp, backwards, nameLength);
    } else {
      queryOutput = await querySummoners(region, timestamp, backwards);
    }

    const summoners: SummonerEntity[] = queryOutput.Items
      ? queryOutput.Items.map((item: Record<string, AttributeValue>) =>
          mapDynamoSummoner(item, region)
        )
      : [];

    return summonersApiResponse(traceId, summoners);
  } catch (e) {
    console.error(e);
    return error(traceId, e.message || 'Internal server error');
  }
};
