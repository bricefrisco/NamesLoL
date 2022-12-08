# NamesLoL - Backend

👁️ Find upcoming and recently expired League of Legends summoner names.  
🔎 Search for summoner names to find out if they are available, or when they will become available.  
📒 View from a list of hundreds of thousands of summoner names across five regions to easily find unique and rare summoner names that are up for grabs.

## Official Website

https://www.nameslol.com/

## Architecture

![architecture](https://i.imgur.com/KK3qnE1.png)

There are three primary sections/processes of this application:

1. A scheduler (1-6) which periodically refreshes summoner data stored in DynamoDB
2. `/{region}/summoner/{name}` API (8-10), where the latest summoner information is fetched from Riot API, persisted to DynamoDB, and returned to the end user
3. `/{region}/summoners` API (11-12), where expiring summoner names are queried from DynamoDB and returned to the end user

We dive deeper into each of these three sections below.

### 1. Scheduler to refresh data

1. A CRON scheduler triggers a Lambda function, `SQSUpdateProducer`
2. `SQSUpdateProducer` queries DynamoDB (`SummonerNames`) for names which are expired or have expired between a specified period
3. `SQSUpdateProducer` sends the names queried above to an SQS Queue (`NameUpdateQueue.fifo`)
4. The `NameUpdateQueue.fifo` triggers the `SQSUpdateConsumer` lambda function
5. `SQSUpdateConsumer` fetches the latest summoner data from Riot API
6. `SQSUpdateConsumer` updates the latest data fetched above into DynamoDB

### 2. Summoner API

7. An end user makes an API request that is routed via API Gateway
8. API Gateway routes the request and invokes the `SummonerAPI` lambda function
9. `SummonerAPI` fetches the latest summoner data from Riot API
10. `SummonerAPI` persists the data fetched above into DynamoDB. The data is then sent back to the user

### 3. Summoners API

7. An end user makes an API request that is routed via API Gateway
8. API Gateway routes this request and invokes the `SummonersAPI` lambda function
9. `SummonersAPI` fetches expiring summoner names from DynamoDB. The data is then sent back to the user

## Tech Stack

- Written in Typescript using NodeJS
- Orchestrated using Serverless Framework and deployed into AWS
- Summoner data stored in DynamoDB
- Requests served behind API Gateway
- Serverless computing done via Lambda functions

## Bugs and Feature Requests

All bugs and feature requests should be submitted by opening a Github [issue](https://github.com/bricefrisco/NamesLoL/issues).  
These can be opened to request a new feature, or to report a current feature that is unavailable.

## Installation

Create an [AWS account](https://aws.amazon.com/account/sign-up),  
Configure [Serverless Framework](https://serverless.com/framework/docs/getting-started) by running `npm install -g serverless` and then running `serverless login`

To test locally, take a look at [Serverless Local Development](https://www.serverless.com/blog/serverless-local-development).  
To deploy to test, run `serverless deploy`.  
To deploy to production, run `serverless deploy --stage prod`.  
That's it! Keep an eye out for output - you will receive links to your API in the console. You can also check AWS API Gateway to get the URLs for your API. You will need this when setting the `.env` in the front-end.

The first deployment may take a few minutes since AWS has to configure all the resources. Subsequent deployments will be much quicker.

Take a look at the [frontend](https://github.com/bricefrisco/NamesLoL-Frontend) for running and deploying the UI.

## Disclaimers

NamesLoL is **not** affiliated with Riot Games.  
This service is and will **always** be **free**.  
NamesLoL does **not** own, sell, or trade any summoner names.  
NamesLoL is in accordance with Riot Games ToS.
