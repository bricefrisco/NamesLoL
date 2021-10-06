import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import {Region} from "@libs/types/region";
import {badRequest, error, notFound, tooManyRequests} from "@libs/responses";
import {validateName, validateRegion} from "@libs/validation";
import {fetchSummoner} from "@libs/riotApi";
import {mapSummoner} from "@libs/mapper";
import {RiotResponse} from "@libs/types/riotResponse";
import {SummonerEntity} from "@libs/types/summonerEntity";
import {updateSummoner} from "@libs/dynamoDB";
import limiter from 'lambda-rate-limiter'

const limit = limiter({
  interval: 1300,
  uniqueTokenPerInterval: 500
})

export const success = (summoner: SummonerEntity): APIGatewayProxyResult => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_SITES,
      'Access-Control-Allow-Methods': process.env.CORS_METHODS,
    },
    body: JSON.stringify(summoner)
  }
}

export const main = (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  console.log(JSON.stringify(event))

  const ip = event.headers['X-Forwarded-For'].split(',')[0]

  return limit.check(1, event.headers['X-Forwarded-For'].split(',')[0])
    .then(() => {
      const region: string | Region = event.pathParameters.region ? event.pathParameters.region.toLowerCase() : undefined
      try {validateRegion(region)} catch (e) {return badRequest(e.message)}

      const name: string = event.pathParameters.name ? event.pathParameters.name.toLowerCase() : undefined
      try {validateName(name)} catch (e) {return badRequest(e.message)}

      console.log('fetching summoner by name: ' + name)
      return fetchSummoner(name, Region[region.toUpperCase() as keyof typeof Region], process.env.RIOT_API_TOKEN)
        .then((summoner: RiotResponse) => mapSummoner(summoner, Region[region.toUpperCase() as keyof typeof Region]))
        .then((summoner: SummonerEntity) => {
          if (!event.queryStringParameters || !event.queryStringParameters.hideSearch) {
            updateSummoner(summoner)
          }

          return summoner;
        })
        .then(success)
        .catch((e) => {
          if (e.toString().includes('summoner not found')) {
            return notFound(`Summoner by name '${name}' was not found`)
          }

          console.error(e)
          return error(e.message ? e.message : e)
        })
    })
    .catch(() => {
      console.log(`'${ip} throttled for sending too many requests.`)
      return tooManyRequests('Too many requests')
    })
}