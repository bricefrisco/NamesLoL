import {
  DynamoDBClient,
  QueryCommandOutput,
  QueryCommand,
  UpdateItemCommandOutput,
  UpdateItemCommand,
  DeleteItemCommandOutput,
  DeleteItemCommand
} from '@aws-sdk/client-dynamodb';
import { Region } from '@libs/types/region';
import { SummonerEntity } from '@libs/types/summonerEntity';

export interface DynamoEntity {
  n: string; // region#name
  ad: number; // availability date
  r: string; // region
  aid: string; // account id
  rd: number; // revision date
  l: number; // level
  nl: string; // name length
  ld: number; // last updated
  si: number; // summoner icon
}

if (!process.env.AWS_REGION) {
  throw new Error('AWS_REGION environment variable must be set!');
}

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });

if (!process.env.DYNAMODB_TABLE) {
  throw new Error('DYNAMODB_TABLE environment variable must be set!');
}

const DYNAMODB_TABLE: string = process.env.DYNAMODB_TABLE;

export const querySummoner = async (region: Region, name: string): Promise<QueryCommandOutput> => {
  return await dynamoDB.send(
    new QueryCommand({
      TableName: DYNAMODB_TABLE,
      ExpressionAttributeValues: {
        ':n': { S: region.toUpperCase() + '#' + name.toUpperCase() }
      },
      KeyConditionExpression: 'n = :n'
    })
  );
};

export const querySummonersBetweenDate = async (
  region: Region,
  t1: Date,
  t2: Date
): Promise<QueryCommandOutput> => {
  return await dynamoDB.send(
    new QueryCommand({
      TableName: DYNAMODB_TABLE,
      Limit: 8000,
      ExpressionAttributeValues: {
        ':region': { S: region.toUpperCase() },
        ':t1': { N: t1.valueOf().toString() },
        ':t2': { N: t2.valueOf().toString() }
      },
      KeyConditionExpression: 'r = :region and ad between :t1 and :t2',
      IndexName: 'region-activation-date-index'
    })
  );
};

export const querySummoners = async (
  region: Region,
  timestamp: number,
  backwards: boolean
): Promise<QueryCommandOutput> => {
  return await dynamoDB.send(
    new QueryCommand({
      TableName: DYNAMODB_TABLE,
      Limit: 35,
      ExpressionAttributeValues: {
        ':region': { S: region.toUpperCase() },
        ':timestamp': { N: timestamp.toString() }
      },
      KeyConditionExpression: backwards
        ? 'r = :region and ad <= :timestamp'
        : 'r = :region and ad >= :timestamp',
      IndexName: 'region-activation-date-index',
      ScanIndexForward: !backwards
    })
  );
};

export const querySummonersByNameSize = async (
  region: Region,
  timestamp: number,
  backwards: boolean,
  nameSize: number
): Promise<QueryCommandOutput> => {
  return await dynamoDB.send(
    new QueryCommand({
      TableName: DYNAMODB_TABLE,
      Limit: 35,
      ExpressionAttributeValues: {
        ':nameLength': { S: `${region.toUpperCase()}#${nameSize}` },
        ':timestamp': { N: timestamp.toString() }
      },
      KeyConditionExpression: backwards
        ? 'nl = :nameLength and ad <= :timestamp'
        : 'nl = :nameLength and ad >= :timestamp',
      IndexName: 'name-length-availability-date-index',
      ScanIndexForward: !backwards
    })
  );
};

export const updateSummoner = async (
  summoner: SummonerEntity
): Promise<UpdateItemCommandOutput> => {
  return await dynamoDB.send(
    new UpdateItemCommand({
      TableName: DYNAMODB_TABLE,
      Key: {
        n: { S: summoner.region.toUpperCase() + '#' + summoner.name.toUpperCase() }
      },
      ExpressionAttributeValues: {
        ':ad': { N: summoner.availabilityDate.toString() },
        ':r': { S: summoner.region.toUpperCase() },
        ':aid': { S: summoner.accountId },
        ':rd': { N: summoner.revisionDate.toString() },
        ':l': { N: summoner.level.toString() },
        ':nl': { S: `${summoner.region.toUpperCase()}#${summoner.name.length}` },
        ':ld': { N: summoner.lastUpdated.toString() },
        ':si': { N: summoner.summonerIcon.toString() }
      },
      UpdateExpression:
        'set ad = :ad, r = :r, aid = :aid, rd = :rd, l = :l, nl = :nl, ld = :ld, si = :si'
    })
  );
};

export const deleteSummoner = async (
  name: string,
  region: Region
): Promise<DeleteItemCommandOutput> => {
  return await dynamoDB.send(
    new DeleteItemCommand({
      TableName: DYNAMODB_TABLE,
      Key: {
        n: { S: region.toUpperCase() + '#' + name.toUpperCase() }
      }
    })
  );
};
