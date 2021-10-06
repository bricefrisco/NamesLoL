export const badRequest = (error: string) => {
  return {
    statusCode: 400,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_SITES,
      'Access-Control-Allow-Methods': process.env.CORS_METHODS,
    },
    body: JSON.stringify({error})
  }
}

export const notFound = (message: string) => {
  return {
    statusCode: 404,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_SITES,
      'Access-Control-Allow-Methods': process.env.CORS_METHODS,
    },
    body: JSON.stringify({message})
  }
}

export const tooManyRequests = (message: string) => {
  return {
    statusCode: 429,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_SITES,
      'Access-Control-Allow-Methods': process.env.CORS_METHODS,
    },
    body: JSON.stringify({message})
  }
}

export const error = (error: string) => {
  return {
    statusCode: 500,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_SITES,
      'Access-Control-Allow-Methods': process.env.CORS_METHODS,
    },
    body: JSON.stringify({error})
  }
}