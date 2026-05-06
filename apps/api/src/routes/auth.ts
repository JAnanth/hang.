import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { sendOtp, verifyOtp } from '../services/otpService.js';
import { createSession, invalidateSession, refreshSession } from '../services/authService.js';
import { authenticate } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number — use E.164 format (e.g. +14155552671)'),
});

const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/),
  code: z.string().length(6, 'OTP must be 6 digits'),
  name: z.string().min(1).max(100).optional(),
  deviceInfo: z.string().optional(),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/otp/send', {
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
    handler: async (request, reply) => {
      const result = sendOtpSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: 'BadRequest',
          message: result.error.issues[0].message,
          statusCode: 400,
        });
      }

      await sendOtp(result.data.phone);
      return reply.status(200).send({ data: { sent: true }, message: 'OTP sent' });
    },
  });

  app.post('/otp/verify', {
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
    handler: async (request, reply) => {
      const result = verifyOtpSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: 'BadRequest',
          message: result.error.issues[0].message,
          statusCode: 400,
        });
      }

      const { phone, code, name, deviceInfo } = result.data;
      const valid = await verifyOtp(phone, code);

      if (!valid) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid or expired OTP',
          statusCode: 401,
        });
      }

      let user = await prisma.user.findUnique({ where: { phone } });
      const isNewUser = !user;

      if (!user) {
        if (!name) {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'name is required for new users',
            statusCode: 400,
          });
        }
        user = await prisma.user.create({
          data: { phone, name },
        });
      }

      const token = await createSession(user.id, deviceInfo);

      return reply.status(200).send({
        data: {
          token,
          user: {
            id: user.id,
            phone: user.phone,
            name: user.name,
            username: user.username,
            avatarUrl: user.avatarUrl,
            berkeleyEmail: user.berkeleyEmail,
            isVerified: user.isVerified,
            pushToken: user.pushToken,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          },
          isNewUser,
        },
      });
    },
  });

  app.post('/session/refresh', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const newToken = await refreshSession(request.sessionId);
      return reply.send({ data: { token: newToken } });
    },
  });

  app.delete('/session', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      await invalidateSession(request.sessionId);
      return reply.status(204).send();
    },
  });
}
