import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import {Region} from "@libs/types/region";

export const main = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  console.log(JSON.stringify(event))
  console.log(Object.values(Region))

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'YAY!'
    })
  }
}