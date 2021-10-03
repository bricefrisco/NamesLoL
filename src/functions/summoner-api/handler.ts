import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import {Region} from "@libs/types/region";
import {badRequest, error} from "@libs/responses";
import {validateName, validateRegion} from "@libs/validation";
import {fetchSummoner} from "@libs/riotApi";
import {mapSummoner} from "@libs/mapper";
import {RiotResponse} from "@libs/types/riotResponse";
import {SummonerEntity} from "@libs/types/summonerEntity";
import {updateSummoner} from "@libs/dynamoDB";

export const success = (summoner: SummonerEntity): APIGatewayProxyResult => {
  return {
    statusCode: 200,
    body: JSON.stringify(summoner)
  }
}

export const main = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  console.log(JSON.stringify(event))

  const region: string | Region = event.pathParameters.region ? event.pathParameters.region.toLowerCase() : undefined
  try {validateRegion(region)} catch (e) {return badRequest(e.message)}

  const name: string = event.pathParameters.name ? event.pathParameters.name.toLowerCase() : undefined
  try {validateName(name)} catch (e) {return badRequest(e.message)}

  return fetchSummoner(name, Region[region.toUpperCase() as keyof typeof Region], process.env.RIOT_API_TOKEN)
    .then((summoner: RiotResponse) => mapSummoner(summoner, Region[region.toUpperCase() as keyof typeof Region]))
    .then((summoner: SummonerEntity) => {
      if (!event.queryStringParameters || !event.queryStringParameters.hideSearch) {
        updateSummoner(summoner)
      }

      return summoner;
    })
    .then(success)
    .catch((e) => error(e.message))
}