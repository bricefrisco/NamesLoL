export const badRequest = (error: string) => {
  return {
    statusCode: 400,
    body: JSON.stringify({error})
  }
}

export const error = (error: string) => {
  return {
    statusCode: 400,
    body: JSON.stringify({error})
  }
}