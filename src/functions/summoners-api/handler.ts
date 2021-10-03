import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import {Region} from "@libs/types/region";
import {querySummoners, querySummonersByNameSize} from "@libs/dynamoDB";
import {mapDynamoSummoner} from "@libs/mapper";
import {SummonerEntity} from "@libs/types/summonerEntity";
import {AttributeMap, QueryOutput} from "aws-sdk/clients/dynamodb";
import {badRequest, error} from "@libs/responses";
import {parseNameLength, parseTimestamp} from "@libs/validation";

const regions: string[] = Object.values(Region).map((r) => r.toLowerCase())

const respond = (summoners: SummonerEntity[]): APIGatewayProxyResult => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      summoners,
      forwards: summoners && summoners.length > 0 && summoners[summoners.length - 1].availabilityDate,
      backwards: summoners && summoners.length > 0 && summoners[0].availabilityDate
    })
  }
}

export const main = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  console.log(JSON.stringify(event))

  let region: string | Region = event.pathParameters.region ? event.pathParameters.region.toLowerCase() : undefined

  if (!regions.includes(region)) {
    return badRequest(`Invalid region '${event.pathParameters.region}'. Correct path is /{region}/summoners, with one of these regions: ${regions.join(', ')}`)
  }

  const backwards = event.queryStringParameters.backwards === "true";

  let timestamp: number
  try {
    timestamp = parseTimestamp(event.queryStringParameters.timestamp)
  } catch (e) {
    return badRequest(e.message)
  }

  let nameLength: number
  try {
    nameLength = parseNameLength(event.queryStringParameters.nameLength)
  } catch (e) {
    return badRequest(e.message)
  }

  if (nameLength) {
    console.log('Querying summoners by name size...')
    return querySummonersByNameSize(Region[region.toUpperCase() as keyof typeof Region], timestamp, backwards, nameLength)
      .then((data) => data.Items
        .sort((a, b) => parseInt(a.ad.N) - parseInt(b.ad.N))
        .map((d) => mapDynamoSummoner(d, Region[region.toUpperCase() as keyof typeof Region])))
      .then(respond)
      .catch((err) => {
        console.error(err)
        return error(err.message)
      })
  }

  console.log('Querying summoners...')
  return querySummoners(Region[region.toUpperCase() as keyof typeof Region], timestamp, backwards)
    .then((data: QueryOutput) => data.Items
      .sort((a: AttributeMap, b: AttributeMap) => parseInt(a.ad.toString()) - parseInt(b.ad.toString()))
      .map((d: AttributeMap) => mapDynamoSummoner(d, Region[region.toUpperCase() as keyof typeof Region])))
    .then(respond)
    .catch((err) => {
      console.error(err)
      return error(err.message)
    })
}