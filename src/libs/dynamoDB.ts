import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommandOutput,
  QueryCommand,
  UpdateCommandOutput,
  UpdateCommand,
  DeleteCommandOutput,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';
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

const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const documentClient = DynamoDBDocumentClient.from(dynamoDBClient);

if (!process.env.DYNAMODB_TABLE) {
  throw new Error('DYNAMODB_TABLE environment variable must be set!');
}

const DYNAMODB_TABLE: string = process.env.DYNAMODB_TABLE;

export const querySummoner = async (region: Region, name: string): Promise<QueryCommandOutput> => {
  return await documentClient.send(
    new QueryCommand({
      TableName: DYNAMODB_TABLE,
      ExpressionAttributeValues: {
        ':n': region.toUpperCase() + '#' + name.toUpperCase()
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
  return await documentClient.send(
    new QueryCommand({
      TableName: DYNAMODB_TABLE,
      Limit: 8000,
      ExpressionAttributeValues: {
        ':region': region.toUpperCase(),
        ':t1': t1.valueOf(),
        ':t2': t2.valueOf()
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
  return await documentClient.send(
    new QueryCommand({
      TableName: DYNAMODB_TABLE,
      Limit: 35,
      ExpressionAttributeValues: {
        ':region': region.toUpperCase(),
        ':timestamp': timestamp
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
  return await documentClient.send(
    new QueryCommand({
      TableName: DYNAMODB_TABLE,
      Limit: 35,
      ExpressionAttributeValues: {
        ':nameLength': `${region.toUpperCase()}#${nameSize}`,
        ':timestamp': timestamp
      },
      KeyConditionExpression: backwards
        ? 'nl = :nameLength and ad <= :timestamp'
        : 'nl = :nameLength and ad >= :timestamp',
      IndexName: 'name-length-availability-date-index',
      ScanIndexForward: !backwards
    })
  );
};

export const updateSummoner = async (summoner: SummonerEntity): Promise<UpdateCommandOutput> => {
  return await documentClient.send(
    new UpdateCommand({
      TableName: DYNAMODB_TABLE,
      Key: {
        n: summoner.region.toUpperCase() + '#' + summoner.name.toUpperCase()
      },
      ExpressionAttributeValues: {
        ':ad': summoner.availabilityDate,
        ':r': summoner.region.toUpperCase(),
        ':aid': summoner.accountId,
        ':rd': summoner.revisionDate,
        ':l': summoner.level,
        ':nl': `${summoner.region.toUpperCase()}#${summoner.name.length}`,
        ':ld': summoner.lastUpdated,
        ':si': summoner.summonerIcon
      },
      UpdateExpression:
        'set ad = :ad, r = :r, aid = :aid, rd = :rd, l = :l, nl = :nl, ld = :ld, si = :si'
    })
  );
};

export const deleteSummoner = async (
  name: string,
  region: Region
): Promise<DeleteCommandOutput> => {
  return await documentClient.send(
    new DeleteCommand({
      TableName: DYNAMODB_TABLE,
      Key: {
        n: region.toUpperCase() + '#' + name.toUpperCase()
      }
    })
  );
};
