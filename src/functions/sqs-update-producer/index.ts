import { handlerPath } from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  memorySize: 256,
  timeout: 900,
  reservedConcurrency: 3,
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: ['dynamodb:Query'],
      Resource: [
        'arn:aws:dynamodb:${aws:region}:${aws:accountId}:table/${sls:stage}-SummonerNames',
        'arn:aws:dynamodb:${aws:region}:${aws:accountId}:table/${sls:stage}-SummonerNames/index/*'
      ]
    }
  ],
  events: [
    {
      schedule: {
        rate: ['cron(0 * ? * * *)'], // Every hour
        input: {
          refreshType: 'HOURLY_REFRESH'
        }
      }
    },
    {
      schedule: {
        rate: ['cron(0 0 ? * 6 *)'], // Every Friday
        input: {
          refreshType: 'WEEKLY_REFRESH'
        }
      }
    },
    {
      schedule: {
        rate: ['cron(0 0 1 * ? *)'], // First day of each month
        input: {
          refreshType: 'MONTHLY_REFRESH'
        }
      },
    },
  ],
}