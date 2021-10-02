import type {AWS} from '@serverless/typescript';

import sqsUpdateConsumer from '@functions/sqs-update-consumer';

const serverlessConfiguration: AWS = {
  service: 'nameslol',
  frameworkVersion: '2',
  variablesResolutionMode: '20210326',
  configValidationMode: 'error',
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: {'require.resolve': undefined},
      platform: 'node',
    },
  },

  plugins: ['serverless-esbuild', 'serverless-iam-roles-per-function'],

  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000 --trace-deprecation',
      RIOT_API_KEY: '${ssm:/riot-api-token}'
    },
    lambdaHashingVersion: '20201221',
  },

  functions: {sqsUpdateConsumer},

  resources: {
    Resources: {
      SummonerNames: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: "${sls:stage}-SummonerNames",
          BillingMode: "PAY_PER_REQUEST",
          AttributeDefinitions: [
            {
              "AttributeName": "n",
              "AttributeType": "S"
            },
            {
              "AttributeName": "nl",
              "AttributeType": "S"
            },
            {
              "AttributeName": "ad",
              "AttributeType": "N"
            },
            {
              "AttributeName": "r",
              "AttributeType": "S"
            }
          ],
          KeySchema: [
            {
              "AttributeName": "n",
              "KeyType": "HASH"
            }
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: "name-length-availability-date-index",
              KeySchema: [
                {
                  "AttributeName": "nl",
                  "KeyType": "HASH"
                },
                {
                  "AttributeName": "ad",
                  "KeyType": "RANGE"
                }
              ],
              Projection: {
                ProjectionType: "ALL"
              }
            },
            {
              IndexName: "region-activation-date-index",
              KeySchema: [
                {
                  "AttributeName": "r",
                  "KeyType": "HASH"
                },
                {
                  "AttributeName": "ad",
                  "KeyType": "RANGE"
                }
              ],
              Projection: {
                ProjectionType: "ALL"
              }
            },
          ]
        }
      },
      NameUpdateQueue: {
        Type: "AWS::SQS::Queue",
        Properties: {
          QueueName: "${sls:stage}-NameUpdateQueue",
          MessageRetentionPeriod: 86400,
          VisibilityTimeout: 300
        }
      }
    }
  }
};

module.exports = serverlessConfiguration;
