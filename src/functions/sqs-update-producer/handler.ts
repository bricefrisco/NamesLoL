import {SQS} from 'aws-sdk'
import {SQSMessage} from "@libs/types/sqsMessages";
import {Region} from "@libs/types/region";
import {querySummonersBetweenDate} from "@libs/dynamoDB";
import {QueryOutput, AttributeMap} from "aws-sdk/clients/dynamodb";

enum RefreshType {
  HOURLY_REFRESH = "HOURLY_REFRESH",
  WEEKLY_REFRESH = "WEEKLY_REFRESH",
  MONTHLY_REFRESH = "MONTHLY_REFRESH"
}

interface ScheduledEvent {
  refreshType: RefreshType
}

const sqs = new SQS({apiVersion: '2012-11-05'})
const DAY = 24 * 60 * 60 * 1000

let curr = 1

// Increment 'curr' between 1 and {CONSUMER_CONCURRENCY}
const increment = (): string => {
  if (curr == parseInt(process.env.CONSUMER_CONCURRENCY) + 1) {
    curr = 2
    return '1'
  } else {
    curr++
    return (curr - 1).toString()
  }
}

const sendMessage = (message: SQSMessage): Promise<string> => {
  return new Promise((res, rej) => {
    const groupIdNumber: string = increment()
    console.log(`Sending message to ${process.env.SQS_QUEUE_URL} ('update-queue-${groupIdNumber}'): ${JSON.stringify(message)}`)
    sqs.sendMessage({
      QueueUrl: process.env.SQS_QUEUE_URL,
      MessageBody: JSON.stringify(message),
      MessageGroupId: `update-queue-${groupIdNumber}`, // Create {CONSUMER_CURRENCY} message groups,
                                                       // lambda will scale up to this amount.
    }, (err) => {
      if (err) rej(`Error occurred while sending message to SQS: ${JSON.stringify(err)}`)
      else res(`Successfully sent ${message.region}#${message.name} to ${process.env.SQS_QUEUE_URL} ('update-queue-${groupIdNumber}')`)
    })
  })
}

const sendMessageWithDelay = (wait: number, n: string, r: string): Promise<any> => {
  return new Promise((res1, rej1) => {
    setTimeout(() => {
      sendMessage({name: n, region: Region[r as keyof typeof Region]}) // Queue up SQS calls
        .then(res1)
        .catch(rej1)
    }, wait)
  })
}

const updateRegion = (region: string, before: number, after: number) => {
  return new Promise<any>((resolve) => {
    querySummonersBetweenDate(Region[region as keyof typeof Region], before, after)
      .then((data: QueryOutput) => {
        const queue: Promise<any>[] = []

        let i = 0
        data.Items.forEach((item: AttributeMap) => {
          const r = item.n.toString().split('#')[0]
          const n = item.n.toString().split('#')[1]
          console.log('adding to queue')
          queue.push(sendMessageWithDelay(i * parseInt(process.env.SQS_SEND_DELAY_MS), n, r).then(console.log).catch(console.error))
          i++
        })

        Promise.all(queue).then(() => resolve(`Completed region ${region}`))
        return queue;
      })
  })
}

export const main = (event: ScheduledEvent) => {
  return new Promise<any>((res, rej) => {
    const now = new Date().valueOf()
    let before: number
    let after: number

    switch (event.refreshType) {
      case RefreshType.HOURLY_REFRESH: // Refresh names +|- 3 days every hour
        before = new Date(now - 3 * DAY).valueOf()
        after = new Date(now + 3 * DAY).valueOf()
        break
      case RefreshType.WEEKLY_REFRESH: // Refresh names +|- 1 month every week
        before = new Date(now - 30 * DAY).valueOf()
        after = new Date(now + 30 * DAY).valueOf()
        break
      case RefreshType.MONTHLY_REFRESH: // Refresh names +|- 3 months every month
        before = new Date(now - 90 * DAY).valueOf()
        after = new Date(now + 90 * DAY).valueOf()
        break
      default:
        throw new Error('Invalid refreshType: ' + event.refreshType)
    }

    const promises: Promise<any>[] = []
    Object.keys(Region).map((region: string) => {
      promises.push(updateRegion(Region[region as keyof typeof Region], before, after))
    })

    Promise.all(promises) // Wait for all updates on all regions to update before resolving
      .then((values) => res(values))
      .catch((err) => rej(err))
  })
}