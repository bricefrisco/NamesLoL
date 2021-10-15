# NamesLoL
👁️ Find upcoming and recently expired League of Legends summoner names.  
🔎 Search for summoner names to find out if they are available, or when they will become available.  
📒 View from a list of hundreds of thousands of summoner names across five regions to easily find unique and rare summoner names that are up for grabs.

## Official Website
https://nameslol.com/

## Architecture
![architecture](https://i.imgur.com/MnuaMxk.png)

## Tech Stack
- Frontend written in Javascript using the ReactJS library.
- Backend written in Typescript using NodeJS.
- Orchestrated using Serverless Framework
- Data is stored in AWS DynamoDB.
- Frontend is hosted in AWS S3 behind CloudFront.
- Backend is run by Lambda functions behind API Gateway

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
