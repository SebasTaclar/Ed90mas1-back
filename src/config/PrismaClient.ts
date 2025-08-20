import { PrismaClient } from '@prisma/client';

// Variable global para singleton de PrismaClient
declare global {
  var __prismaClient: PrismaClient | undefined;
}

export const getPrismaClient = (): PrismaClient => {
  if (!global.__prismaClient) {
    global.__prismaClient = new PrismaClient({
      log: ['warn', 'error'],
    });
  }

  return global.__prismaClient;
};
