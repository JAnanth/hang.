import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { groupRoutes } from './routes/groups.js';
import { eventRoutes } from './routes/events.js';
import { notificationRoutes } from './routes/notifications.js';
import { registerRateLimit } from './middleware/rateLimit.js';
import { startReminderWorker } from './jobs/reminderJob.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
    trustProxy: true,
  });

  await app.register(helmet, {
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? true,
    credentials: true,
  });

  await registerRateLimit(app);

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(userRoutes, { prefix: '/api/v1/users' });
  await app.register(groupRoutes, { prefix: '/api/v1/groups' });
  await app.register(eventRoutes, { prefix: '/api/v1/events' });
  await app.register(notificationRoutes, { prefix: '/api/v1/notifications' });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const statusCode = error.statusCode ?? 500;
    reply.status(statusCode).send({
      error: error.name ?? 'InternalServerError',
      message: process.env.NODE_ENV === 'production' ? 'An internal error occurred' : error.message,
      statusCode,
    });
  });

  return app;
}

async function start() {
  const app = await buildApp();
  const port = parseInt(process.env.PORT ?? '3000');

  if (process.env.NODE_ENV !== 'test') {
    startReminderWorker();
  }

  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`Server running on port ${port}`);
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
