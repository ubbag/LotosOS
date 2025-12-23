import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import { env } from './config/env';
import { authRoutes } from './modules/auth/auth.routes';
import { klienciRoutes } from './modules/klienci/klienci.routes';
import { kategorieRoutes } from './modules/kategorie/kategorie.routes';
import { uslugiRoutes } from './modules/uslugi/uslugi.routes';
import { gabinetyRoutes } from './modules/gabinety/gabinety.routes';
import { masazysciRoutes } from './modules/masazysci/masazysci.routes';
import { rezerwacjeRoutes } from './modules/rezerwacje/rezerwacje.routes';
import { harmonogramRoutes } from './modules/harmonogram/harmonogram.routes';
import { pakietyRoutes } from './modules/pakiety/pakiety.routes';
import { voucheryRoutes } from './modules/vouchery/vouchery.routes';
import { raportyRoutes } from './modules/raporty/raporty.routes';
import { smsRoutes } from './modules/sms/sms.routes';
import { publicRoutes } from './modules/public/public.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { settingsRoutes } from './modules/settings/settings.routes';
import { AppError, ValidationError } from './shared/errors';
import { initializeJobs, stopJobs } from './modules/jobs';

const fastify = Fastify({
  logger: {
    level: env.isDevelopment ? 'debug' : 'info',
    transport: env.isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  },
});

// Register CORS plugin
fastify.register(fastifyCors, {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Register JWT plugin
fastify.register(fastifyJwt, {
  secret: env.jwtSecret,
});

// Global error handler
fastify.setErrorHandler(async (error: Error, _request: FastifyRequest, reply: FastifyReply) => {
  fastify.log.error(error);

  if (error instanceof ValidationError) {
    return reply.code(error.statusCode).send({
      success: false,
      code: error.code,
      message: error.message,
      errors: error.errors,
    });
  }

  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      success: false,
      code: error.code,
      message: error.message,
    });
  }

  // Default error response
  return reply.code(500).send({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: env.isDevelopment ? error.message : 'An error occurred',
  });
});

// Basic health check route
fastify.get('/health', async (_request, _reply) => {
  return {
    status: 'ok',
    message: 'Lotos SPA Backend is running',
    timestamp: new Date().toISOString(),
  };
});

// API info route
fastify.get('/api/info', async (_request, _reply) => {
  return {
    name: env.appName,
    version: env.appVersion,
    environment: env.nodeEnv,
  };
});

// Register public routes (no auth required)
fastify.register(publicRoutes, { prefix: '/public' });

// Register protected routes
fastify.register(async (fastify) => {
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(dashboardRoutes, { prefix: '/dashboard' });
  fastify.register(settingsRoutes, { prefix: '/settings' });
  fastify.register(klienciRoutes, { prefix: '/klienci' });
  fastify.register(kategorieRoutes, { prefix: '/kategorie' });
  fastify.register(uslugiRoutes, { prefix: '/uslugi' });
  fastify.register(gabinetyRoutes, { prefix: '/gabinety' });
  fastify.register(masazysciRoutes, { prefix: '/masazysci' });
  fastify.register(rezerwacjeRoutes, { prefix: '/rezerwacje' });
  fastify.register(harmonogramRoutes, { prefix: '/harmonogram' });
  fastify.register(pakietyRoutes, { prefix: '/pakiety' });
  fastify.register(voucheryRoutes, { prefix: '/vouchery' });
  fastify.register(raportyRoutes, { prefix: '/raporty' });
  fastify.register(smsRoutes, { prefix: '/sms' });
}, { prefix: '/api' });

const start = async () => {
  try {
    // Initialize background jobs system
    await initializeJobs();

    // Start HTTP server
    await fastify.listen({ port: env.port, host: '0.0.0.0' });
    console.log(`✨ ${env.appName} server running on http://localhost:${env.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n✋ Shutting down gracefully...');
  await stopJobs();
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n✋ Shutting down gracefully...');
  await stopJobs();
  await fastify.close();
  process.exit(0);
});
