/**
 * Shared Prisma Client Instance
 *
 * This file exports a singleton PrismaClient instance that is shared across
 * the entire application. Using a single instance prevents connection pool
 * exhaustion and improves performance.
 *
 * IMPORTANT: All other files should import from this file instead of creating
 * new PrismaClient() instances.
 *
 * Usage:
 * import { prisma } from '@/shared/prisma';
 *
 * const users = await prisma.user.findMany();
 */

import { PrismaClient } from '@prisma/client';

/**
 * Instantiate PrismaClient
 *
 * In development, reuse the client across hot reloads to prevent
 * "too many connections" errors. In production, Prisma handles
 * connection pooling automatically.
 */
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn'] // Log queries in development
        : ['error'], // Only log errors in production
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown handler
 *
 * Disconnect Prisma when the application shuts down to prevent
 * hanging connections.
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}
