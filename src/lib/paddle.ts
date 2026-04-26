import { Paddle, Environment } from '@paddle/paddle-node-sdk'

// Use PADDLE_ENVIRONMENT to explicitly control sandbox vs production.
// NODE_ENV is always 'production' on Vercel even for sandbox deployments,
// so relying on it causes forbidden errors when key/customer IDs are sandbox.
export const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment:
    process.env.PADDLE_ENVIRONMENT === 'production' ? Environment.production : Environment.sandbox,
})
