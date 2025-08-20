import { PrismaClient } from '@prisma/client';

/**
 * Connection Manager para Azure Functions
 * Maneja la creación y cleanup de conexiones de base de datos
 * optimizada para entornos serverless
 */
export class ConnectionManager {
  private static instances = new Map<string, PrismaClient>();
  private static connectionCounts = new Map<string, number>();

  /**
   * Obtiene una instancia de PrismaClient optimizada para Azure Functions
   */
  static getPrismaInstance(instanceId: string = 'default'): PrismaClient {
    if (!this.instances.has(instanceId)) {
      console.log(`[ConnectionManager] Creating new Prisma instance: ${instanceId}`);

      const client = new PrismaClient({
        log: ['warn', 'error'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });

      // Configurar cleanup automático
      this.setupCleanup(client, instanceId);
      this.instances.set(instanceId, client);
      this.connectionCounts.set(instanceId, 0);
    }

    const count = this.connectionCounts.get(instanceId) || 0;
    this.connectionCounts.set(instanceId, count + 1);

    return this.instances.get(instanceId)!;
  }

  /**
   * Cierra todas las conexiones
   */
  static async closeAll(): Promise<void> {
    console.log(`[ConnectionManager] Closing ${this.instances.size} Prisma instances`);

    const closePromises = Array.from(this.instances.entries()).map(async ([id, client]) => {
      try {
        await client.$disconnect();
        console.log(`[ConnectionManager] Instance ${id} disconnected`);
      } catch (error) {
        console.error(`[ConnectionManager] Error disconnecting instance ${id}:`, error);
      }
    });

    await Promise.allSettled(closePromises);

    this.instances.clear();
    this.connectionCounts.clear();
  }

  /**
   * Obtiene estadísticas de conexiones
   */
  static getStats(): { [instanceId: string]: number } {
    return Object.fromEntries(this.connectionCounts);
  }

  private static setupCleanup(client: PrismaClient, instanceId: string): void {
    // Cleanup en diferentes eventos del proceso
    const cleanup = async () => {
      try {
        await client.$disconnect();
        this.instances.delete(instanceId);
        this.connectionCounts.delete(instanceId);
        console.log(`[ConnectionManager] Instance ${instanceId} cleaned up`);
      } catch (error) {
        console.error(`[ConnectionManager] Cleanup error for ${instanceId}:`, error);
      }
    };

    process.on('beforeExit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
  }
}
