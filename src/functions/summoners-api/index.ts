import {handlerPath} from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  memorySize: 128,
  timeout: 10,
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: ['dynamodb:Query', 'dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem'],
      Resource: [
        'arn:aws:dynamodb:${aws:region}:${aws:accountId}:table/${sls:stage}-SummonerNames',
        'arn:aws:dynamodb:${aws:region}:${aws:accountId}:table/${sls:stage}-SummonerNames/index/*'
      ]
    }
  ],
  events: [
    {
      http: {
        path: '/{region}/summoners',
        method: 'get',
        cors: true,
        request: {
          parameters: {
            paths: {
              region: true
            }
          }
        }
      }
    }
  ],
}