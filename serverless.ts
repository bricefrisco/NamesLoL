import type { AWS } from '@serverless/typescript';

import { sqsUpdateConsumer, sqsUpdateProducer, summonerApi, summonersApi } from '@functions/index';

const serverlessConfiguration: AWS = {
  service: 'nameslol',
  frameworkVersion: '3',
  configValidationMode: 'error',
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node'
    },
    warmup: {
      warmer: {
        enabled: false, // Enabled at function level
        package: {
          individually: false
        },
        prewarm: true,
        payload: { body: 'serverless-warmer' }
      }
    }
  },

  plugins: ['serverless-esbuild', 'serverless-iam-roles-per-function', 'serverless-plugin-warmup'],

  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000 --trace-deprecation',
      RIOT_API_TOKEN: '${ssm:/riot-api-token}',
      DYNAMODB_TABLE: '${sls:stage}-SummonerNames',
      SQS_QUEUE_URL:
        'https://sqs.us-east-1.amazonaws.com/${aws:accountId}/${sls:stage}-NameUpdateQueue.fifo',
      CONSUMER_CONCURRENCY: '10', // Keep below 15 to avoid exceeding Riot rate limits
      SQS_SEND_DELAY_MS: '50', // Delay in milliseconds to avoid exceeding SQS rate limits
      CORS_METHODS: 'OPTIONS, GET',
      CORS_SITES: '*'
    }
  },

  functions: {
    sqsUpdateConsumer,
    sqsUpdateProducer,
    summonersApi,
    summonerApi
  },

  resources: {
    Resources: {
      SummonerNames: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${sls:stage}-SummonerNames',
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            {
              AttributeName: 'n',
              AttributeType: 'S'
            },
            {
              AttributeName: 'nl',
              AttributeType: 'S'
            },
            {
              AttributeName: 'ad',
              AttributeType: 'N'
            },
            {
              AttributeName: 'r',
              AttributeType: 'S'
            }
          ],
          KeySchema: [
            {
              AttributeName: 'n',
              KeyType: 'HASH'
            }
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: 'name-length-availability-date-index',
              KeySchema: [
                {
                  AttributeName: 'nl',
                  KeyType: 'HASH'
                },
                {
                  AttributeName: 'ad',
                  KeyType: 'RANGE'
                }
              ],
              Projection: {
                ProjectionType: 'ALL'
              }
            },
            {
              IndexName: 'region-activation-date-index',
              KeySchema: [
                {
                  AttributeName: 'r',
                  KeyType: 'HASH'
                },
                {
                  AttributeName: 'ad',
                  KeyType: 'RANGE'
                }
              ],
              Projection: {
                ProjectionType: 'ALL'
              }
            }
          ]
        }
      },
      NameUpdateQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: '${sls:stage}-NameUpdateQueue.fifo',
          MessageRetentionPeriod: 86400,
          VisibilityTimeout: 90,
          FifoQueue: true,
          ContentBasedDeduplication: true,
          DeduplicationScope: 'messageGroup',
          FifoThroughputLimit: 'perMessageGroupId'
        }
      }
    }
  }
};

module.exports = serverlessConfiguration;
