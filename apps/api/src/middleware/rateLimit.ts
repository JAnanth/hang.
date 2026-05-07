import type { FastifyInstance } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';
import { getRedis } from '../lib/redis';

export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(fastifyRateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    redis: getRedis(),
    keyGenerator: (request) => {
      return (request as typeof request & { user?: { id: string } }).user?.id ?? request.ip;
    },
    errorResponseBuilder: () => ({
      error: 'TooManyRequests',
      message: 'Rate limit exceeded. Please slow down.',
      statusCode: 429,
    }),
  });

  app.addHook('onRoute', (routeOptions) => {
    if (routeOptions.url.startsWith('/api/v1/auth/otp')) {
      routeOptions.config = {
        ...routeOptions.config,
        rateLimit: {
          max: 5,
          timeWindow: '15 minutes',
        },
      };
    }
  });
}
