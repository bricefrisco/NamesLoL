import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Region } from '@libs/types/region';
import { querySummoners, querySummonersByNameSize } from '@libs/dynamoDB';
import { mapDynamoSummoner } from '@libs/mapper';
import { SummonerEntity } from '@libs/types/summonerEntity';
import { AttributeMap, QueryOutput } from 'aws-sdk/clients/dynamodb';
import { badRequest, error, warmUp } from '@libs/responses';
import { getValidRegions, parseNameLength, parseTimestamp, regionIsValid } from '@libs/validation';

const mapResponse = (summoners: SummonerEntity[]): APIGatewayProxyResult => {
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

  let timestamp: number;
  try {
    timestamp = parseTimestamp(event.queryStringParameters.timestamp);
  } catch (e) {
    return badRequest(e.message);
  }

  let nameLength: number;
  try {
    nameLength = parseNameLength(event.queryStringParameters.nameLength);
  } catch (e) {
    return badRequest(e.message);
  }

  const backwards = event.queryStringParameters?.backwards === 'true';

  // Fetch names from DynamoDB
  try {
    let queryOutput: QueryOutput;
    if (nameLength) {
      console.log('Querying summoners by name size...');
      queryOutput = await querySummonersByNameSize(region, timestamp, backwards, nameLength);
    } else {
      console.log('Querying summoners...');
      queryOutput = await querySummoners(region, timestamp, backwards);
    }

    const summoners: SummonerEntity[] = queryOutput.Items.map((item: AttributeMap) =>
      mapDynamoSummoner(item, region),
    );

    return mapResponse(summoners);
  } catch (e) {
    console.error(e);
    return error(e.message || 'Internal server error');
  }
};
