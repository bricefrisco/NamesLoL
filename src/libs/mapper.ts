import { Region } from '@libs/types/region';
import { SummonerEntity } from '@libs/types/summonerEntity';
import { RiotResponse } from '@libs/types/riotResponse';
import { AttributeMap } from 'aws-sdk/clients/dynamodb';

const calcAvailabilityDate = (revisionDate: number, summonerLevel: number): number => {
  const date = new Date(revisionDate);
  if (summonerLevel <= 6) {
    return new Date(date.setMonth(date.getMonth() + 6)).valueOf();
  }

  if (summonerLevel >= 30) {
    return new Date(date.setMonth(date.getMonth() + 30)).valueOf();
  }

  return new Date(date.setMonth(date.getMonth() + summonerLevel)).valueOf();
};

export const mapSummoner = (summoner: RiotResponse, r: Region): SummonerEntity => {
  return {
    name: summoner.name,
    summonerIcon: summoner.profileIconId,
    availabilityDate: calcAvailabilityDate(summoner.revisionDate, summoner.summonerLevel),
    lastUpdated: new Date().valueOf(),
    region: r,
    level: summoner.summonerLevel,
    revisionDate: summoner.revisionDate,
    accountId: summoner.accountId,
  };
};

export const mapDynamoSummoner = (attributes: AttributeMap, r: Region): SummonerEntity => {
  return {
    name: attributes.n.toString().split('#')[1].toLowerCase(),
    summonerIcon: attributes.si && parseInt(attributes.si.toString()), // May be null - added later on
    availabilityDate: parseInt(attributes.ad.toString()),
    lastUpdated: parseInt(attributes.ld.toString()),
    region: r,
    level: parseInt(attributes.l.toString()),
    revisionDate: parseInt(attributes.rd.toString()),
    accountId: attributes.aid.toString(),
  };
};

export const mapSummoners = (summoners: RiotResponse[], r: Region): SummonerEntity[] => {
  return summoners.map((summoner: RiotResponse) => mapSummoner(summoner, r));
};
