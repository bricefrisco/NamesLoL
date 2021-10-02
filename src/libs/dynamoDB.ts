import { DynamoDB } from 'aws-sdk';
import {QueryOutput, UpdateItemOutput, DeleteItemOutput} from "aws-sdk/clients/dynamodb";
import {Region} from "@libs/types/region";
import {SummonerEntity} from "@libs/types/summonerEntity";

const client = new DynamoDB.DocumentClient();

export const querySummoner = (region: Region, name: string): Promise<QueryOutput> => {
  return new Promise((res, rej) => {
    client.query({
      TableName: "lol-summoners",
      ExpressionAttributeValues: {
        ":n": region.toUpperCase() + "#" + name.toUpperCase(),
      },
      KeyConditionExpression: "n = :n",
    }, (err, data) => {
      if (err) rej(err);
      else res(data);
    });
  });
};

export const querySummonersBetweenDate = (region: Region, t1: number, t2: number): Promise<QueryOutput> => {
  return new Promise((res, rej) => {
    client.query({
      TableName: 'lol-summoners',
      Limit: 8000,
      ExpressionAttributeValues: {
        ':region': region.toUpperCase(),
        ':t1': t1,
        ':t2': t2
      },
      KeyConditionExpression: 'r = :region and ad between :t1 and :t2',
      IndexName: 'region-activation-date-index'
    }, (err, data) => {
      if (err) rej(err)
      else res(data)
    });
  });
}

export const querySummoners = (region: Region, timestamp: number, backwards: boolean): Promise<QueryOutput> => {
  return new Promise((res, rej) => {
    client.query({
      TableName: "lol-summoners",
      Limit: 35,
      ExpressionAttributeValues: {
        ":region": region.toUpperCase(),
        ":timestamp": timestamp,
      },
      KeyConditionExpression: backwards
        ? "r = :region and ad <= :timestamp"
        : "r = :region and ad >= :timestamp",
      IndexName: "region-activation-date-index",
      ScanIndexForward: !backwards,
    }, (err, data) => {
      if (err) rej(err);
      else res(data);
    });
  });
};

export const querySummonersByNameSize = (region: Region, timestamp: number, backwards: boolean, nameSize: number): Promise<QueryOutput> => {
  return new Promise((res, rej) => {
    client.query({
      TableName: "lol-summoners",
      Limit: 35,
      ExpressionAttributeValues: {
        ":nameLength": region.toUpperCase() + "#" + nameSize,
        ":timestamp": timestamp,
      },
      KeyConditionExpression: backwards
        ? "nl = :nameLength and ad <= :timestamp"
        : "nl = :nameLength and ad >= :timestamp",
      IndexName: "name-length-availability-date-index",
      ScanIndexForward: !backwards,
    }, (err, data) => {
      if (err) rej(err);
      else res(data);
    });
  });
};

export const updateSummoner = (summoner: SummonerEntity): Promise<UpdateItemOutput> => {
  return new Promise((res, rej) => {
    client.update({
      TableName: "lol-summoners",
      Key: {
        n: summoner.region.toUpperCase() + "#" + summoner.name.toUpperCase(),
      },
      ExpressionAttributeValues: {
        ":ad": summoner.availabilityDate,
        ":r": summoner.region.toUpperCase(),
        ":aid": summoner.accountId,
        ":rd": summoner.revisionDate,
        ":l": summoner.level,
        ":nl": summoner.region.toUpperCase() + "#" + summoner.name.length,
        ":ld": summoner.lastUpdated,
      },
      UpdateExpression:
        "set ad = :ad, r = :r, aid = :aid, rd = :rd, l = :l, nl = :nl, ld = :ld",
    }, (err, data) => {
      if (err) rej(err)
      else res(data)
    })
  })
};

export const deleteSummoner = (name: string, region: Region): Promise<DeleteItemOutput> => {
  return new Promise<DeleteItemOutput>((res, rej) => {
    client.delete({
      TableName: "lol-summoners",
      Key: {
        n: region.toUpperCase() + '#' + name.toUpperCase()
      }
    }, (err, data) => {
      if (err) rej(err);
      else res(data);
    });
  });
};