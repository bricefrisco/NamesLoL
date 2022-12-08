import { SQS } from 'aws-sdk';
import { SQSMessage } from '@libs/types/sqsMessages';
import { Region } from '@libs/types/region';
import { querySummonersBetweenDate } from '@libs/dynamoDB';
import { QueryOutput, AttributeMap } from 'aws-sdk/clients/dynamodb';

enum RefreshType {
  HOURLY_REFRESH = 'HOURLY_REFRESH',
  WEEKLY_REFRESH = 'WEEKLY_REFRESH',
  MONTHLY_REFRESH = 'MONTHLY_REFRESH',
}

interface ScheduledEvent {
  refreshType: RefreshType;
}

interface Bounds {
  start: Date;
  end: Date;
}

const sqs = new SQS({ apiVersion: '2012-11-05' });
const DAY = 24 * 60 * 60 * 1000;

const consumerConcurrency: number = parseInt(process.env.CONSUMER_CONCURRENCY);
let currentGroupId = 0;

const getGroupId = (): number => {
  if (currentGroupId >= consumerConcurrency) {
    currentGroupId = 0;
  }

  currentGroupId++;
  return currentGroupId;
};

const sendMessage = async (message: SQSMessage): Promise<void> => {
  const groupId: number = getGroupId();

  console.log(
    `Sending message to ${process.env.SQS_QUEUE_URL} ('update-queue-${groupId}'): ${JSON.stringify(
      message,
    )}`,
  );

  await sqs
    .sendMessage({
      QueueUrl: process.env.SQS_QUEUE_URL,
      MessageBody: JSON.stringify(message),
      // Create {CONSUMER_CURRENCY} message groups, lambda will scale up to this amount
      MessageGroupId: `update-queue-${groupId}`,
    })
    .promise();
};

const getBounds = (refreshType: RefreshType): Bounds => {
  const now = new Date().valueOf();

  switch (refreshType) {
    case RefreshType.HOURLY_REFRESH:
      return {
        start: new Date(now - 3 * DAY),
        end: new Date(now + 3 * DAY),
      };
    case RefreshType.WEEKLY_REFRESH:
      return {
        start: new Date(now - 30 * DAY),
        end: new Date(now + 30 * DAY),
      };
    case RefreshType.MONTHLY_REFRESH:
      return {
        start: new Date(now - 90 * DAY),
        end: new Date(now + 90 * DAY),
      };
    default:
      throw new Error(`Invalid refresh type: ${refreshType}`);
  }
};

export const main = async (event: ScheduledEvent): Promise<void> => {
  const { start, end } = getBounds(event.refreshType);

  for (const regionStr of Object.keys(Region)) {
    const region = Region[regionStr as keyof typeof Region];

    const results: QueryOutput = await querySummonersBetweenDate(region, start, end);

    for (const item of results.Items as AttributeMap[]) {
      const r = item.n.toString().split('#')[0];
      const n = item.n.toString().split('#')[1];
      try {
        await sendMessage({ name: n, region: Region[r as keyof typeof Region] });
      } catch (e) {
        console.error(`Error occurred sending ${r}#${n} to update queue`, e);
      }
    }
  }
};
