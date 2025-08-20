import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;
let connectionCount = 0;

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    connectionCount++;
    console.log(
      `[PRISMA] Creating new client #${connectionCount} at ${new Date().toISOString()} - PID: ${process.pid}`
    );

    prisma = new PrismaClient({
      log: ['warn', 'error'], // Reducir logging para performance
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Log cuando se conecta
    prisma
      .$connect()
      .then(() => {
        console.log(`[PRISMA] Client #${connectionCount} connected successfully`);
      })
      .catch((error) => {
        console.error(`[PRISMA] Client #${connectionCount} connection failed:`, error);
      });

    // Cleanup en shutdown
    process.on('beforeExit', async () => {
      console.log(`[PRISMA] Process exiting, disconnecting client #${connectionCount}`);
      await closePrismaConnection();
    });
  }
  return prisma;
};

export const closePrismaConnection = async (): Promise<void> => {
  if (prisma) {
    try {
      console.log(`[PRISMA] Disconnecting client #${connectionCount}`);
      await prisma.$disconnect();
      prisma = null;
      console.log(`[PRISMA] Client disconnected successfully`);
    } catch (error) {
      console.error(`[PRISMA] Error during disconnect:`, error);
      prisma = null; // Force reset even on error
    }
  }
};

// Global error handler para conexiones
export const handlePrismaError = (error: any): never => {
  if (error.message?.includes('Too many database connections')) {
    console.error('[PRISMA] CONNECTION LIMIT EXCEEDED - Implementing backoff strategy');
    // Force disconnect and retry logic
    closePrismaConnection();
    throw new Error('Database connection limit exceeded. Please try again in a moment.');
  }
  throw error;
};

export { prisma as defaultPrismaClient };
