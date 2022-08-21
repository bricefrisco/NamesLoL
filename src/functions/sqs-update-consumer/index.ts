import { handlerPath } from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  memorySize: 128,
  timeout: 90,
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: [
        'dynamodb:Query',
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
      ],
      Resource:
        'arn:aws:dynamodb:${aws:region}:${aws:accountId}:table/${sls:stage}-SummonerNames',
    },
  ],
  events: [
    {
      sqs: {
        arn: 'arn:aws:sqs:${aws:region}:${aws:accountId}:${sls:stage}-NameUpdateQueue.fifo',
      },
    },
  ],
};
