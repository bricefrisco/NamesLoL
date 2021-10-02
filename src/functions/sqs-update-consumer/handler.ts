import {SQSEvent} from 'aws-lambda'

export const main = async (event: SQSEvent) => {
  console.log("Event received: " + event)
}
