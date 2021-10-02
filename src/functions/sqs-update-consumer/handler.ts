import {SQSEvent, SQSRecord} from 'aws-lambda'
import {Region} from "@libs/types/region";
import {RiotResponse} from "@libs/types/riotResponse";
import {mapSummoner} from "@libs/mapper";
import {SummonerEntity} from "@libs/types/summonerEntity";
import {deleteSummoner, updateSummoner} from "@libs/dynamoDB";
import {fetchSummoner} from "@libs/riotApi";
import {SQSMessage} from "@libs/types/sqsMessages";

const updateOrDeleteSummoner = (name: string, region: Region, token: string) => {
  return new Promise((res, rej) => {
    fetchSummoner(name, region, token)
      .then((summoner: RiotResponse) => {
        return mapSummoner(summoner, region)
      })
      .then((summoner: SummonerEntity) => {
        if (summoner.name.toUpperCase() !== name.toUpperCase()) {
          deleteSummoner(name, region)
            .then(() => res(`Deleted summoner ${summoner.name.toUpperCase()}. New summoner name: ${summoner.name.toUpperCase()}`))
            .catch((err) => rej(`Error occurred while deleting summoner ${summoner.name.toUpperCase()} - ${err.message}`))
        }
        return summoner;
      })
      .then((summoner: SummonerEntity) => {
        updateSummoner(summoner)
          .then(() => res(`Successfully updated summoner ${region}#${name}`))
          .catch((err) => rej(`Error occurred while updating summoner ${region}#${name} - ${err.message}`))
      })
      .catch((err) => rej(`Error occurred while fetching summoner ${region}#${name}: ${err.toString()}`))
  })
}

export const main = (event: SQSEvent) => {
  return new Promise<any>((res) => {
    const items: SQSMessage[] = event.Records.map((event: SQSRecord) => JSON.parse(event.body))

    const proc = (x: number) => {
      if (x < items.length) {
        updateOrDeleteSummoner(items[x].name, Region[items[x].region as keyof typeof Region], process.env.RIOT_API_TOKEN)
          .then((msg) => console.log(msg))
          .catch((err) => console.error(err))
          .finally(() => proc(x + 1))
      } else {
        res('done')
      }
    }

    proc(0)
  })
}
