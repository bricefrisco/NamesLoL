import { SQSEvent, SQSRecord } from 'aws-lambda';
import { Region } from '@libs/types/region';
import { RiotResponse } from '@libs/types/riotResponse';
import { mapSummoner } from '@libs/mapper';
import { SummonerEntity } from '@libs/types/summonerEntity';
import { deleteSummoner, updateSummoner } from '@libs/dynamoDB';
import { fetchSummoner } from '@libs/riotApi';
import { SQSMessage } from '@libs/types/sqsMessages';

const updateOrDeleteSummoner = async (
  name: string,
  region: Region,
  token: string,
): Promise<void> => {
  let response: RiotResponse;

  try {
    response = await fetchSummoner(name, region, token);
  } catch (e) {
    if (e.message?.includes('summoner not found')) {
      console.log(
        `Deleting summoner ${region.toUpperCase()}#${name.toUpperCase} - summoner not found`,
      );
      await deleteSummoner(name, region);
      return;
    } else {
      throw e;
    }
  }

  const summoner: SummonerEntity = mapSummoner(response, region);

  if (name.toUpperCase() !== summoner.name.toUpperCase()) {
    console.log(
      `Deleting summoner ${region.toUpperCase()}#${name.toUpperCase()} - summoner name has changed to ${
        summoner.name.toUpperCase
      }`,
    );

    await deleteSummoner(name, region);
  } else {
    console.log(`Updating summoner ${region.toUpperCase()}#${name.toUpperCase()}`);
    await updateSummoner(summoner);
  }
};

export const main = async (event: SQSEvent): Promise<void> => {
  const summoners: SQSMessage[] = event.Records.map((event: SQSRecord) => JSON.parse(event.body));

  for (const summoner of summoners) {
    try {
      await updateOrDeleteSummoner(
        summoner.name,
        Region[summoner.region as keyof typeof Region],
        process.env.RIOT_API_TOKEN,
      );
    } catch (e) {
      console.error(`Could not update summoner ${summoner.region}#${summoner.name}`, e);
    }
  }
};
