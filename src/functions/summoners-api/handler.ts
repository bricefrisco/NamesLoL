import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Region } from '@libs/types/region';
import { querySummoners, querySummonersByNameSize } from '@libs/dynamoDB';
import { mapDynamoSummoner } from '@libs/mapper';
import { SummonerEntity } from '@libs/types/summonerEntity';
import { AttributeMap, QueryOutput } from 'aws-sdk/clients/dynamodb';
import { badRequest, error, warmUp } from '@libs/responses';
import {
  parseNameLength,
  parseTimestamp,
  validateRegion,
} from '@libs/validation';

const respond = (summoners: SummonerEntity[]): APIGatewayProxyResult => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_SITES,
      'Access-Control-Allow-Methods': process.env.CORS_METHODS,
    },
    body: JSON.stringify({
      summoners,
      forwards:
        summoners &&
        summoners.length > 0 &&
        summoners[summoners.length - 1].availabilityDate,
      backwards:
        summoners && summoners.length > 0 && summoners[0].availabilityDate,
    }),
  };
};

export const main = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResult> => {
  console.log(JSON.stringify(event));

  if (event.body === 'serverless-warmer') {
    return new Promise((resolve) => {
      console.log('Function is warm!');
      resolve(warmUp('Function is warm.'));
    });
  }

  if (!event.queryStringParameters) {
    return badRequest(
      "Required parameter 'timestamp' is not present. Example: /{region}/summoners?timestamp=12345",
    );
  }

  const region: string | Region = event.pathParameters.region
    ? event.pathParameters.region.toLowerCase()
    : undefined;

  try {
    validateRegion(region);
  } catch (e) {
    return badRequest(e.message);
  }

  const backwards =
    event.queryStringParameters.backwards !== null &&
    event.queryStringParameters.backwards === 'true';

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

  if (nameLength) {
    console.log('Querying summoners by name size...');
    return querySummonersByNameSize(
      Region[region.toUpperCase() as keyof typeof Region],
      timestamp,
      backwards,
      nameLength,
    )
      .then((data) =>
        data.Items.sort(
          (a, b) => parseInt(a.ad.toString()) - parseInt(b.ad.toString()),
        ).map((d) =>
          mapDynamoSummoner(
            d,
            Region[region.toUpperCase() as keyof typeof Region],
          ),
        ),
      )
      .then(respond)
      .catch((err) => {
        console.error(err);
        return error(err.message);
      });
  }

  console.log('Querying summoners...');
  return querySummoners(
    Region[region.toUpperCase() as keyof typeof Region],
    timestamp,
    backwards,
  )
    .then((data: QueryOutput) =>
      data.Items.sort(
        (a: AttributeMap, b: AttributeMap) =>
          parseInt(a.ad.toString()) - parseInt(b.ad.toString()),
      ).map((d: AttributeMap) =>
        mapDynamoSummoner(
          d,
          Region[region.toUpperCase() as keyof typeof Region],
        ),
      ),
    )
    .then(respond)
    .catch((err) => {
      console.error(err);
      return error(err.message);
    });
};
