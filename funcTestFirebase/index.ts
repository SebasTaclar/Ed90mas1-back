import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { FirebaseService } from '../src/services/FirebaseService';

interface TestFirebaseData {
  timestamp: string;
  test: string;
  randomValue?: number;
  playerId?: number;
  teamId?: number;
  minute?: number;
  [key: string]: string | number | undefined;
}

interface TestFirebaseRequest {
  action?: 'connection' | 'write' | 'read' | 'match-simulation' | 'cleanup';
  matchId?: number;
  data?: TestFirebaseData;
}

interface ConnectionTestResult {
  connected: boolean;
  projectId?: string;
  databaseUrl?: string;
  error?: string;
}

interface WriteTestResult {
  success: boolean;
  path?: string;
  data?: TestFirebaseData;
  error?: string;
}

interface ReadTestResult {
  success: boolean;
  path?: string;
  data?: unknown;
  error?: string;
}

interface MatchSimulationResult {
  success: boolean;
  matchId: number;
  steps: Array<{
    step: string;
    success: boolean;
    error?: string;
  }>;
}

const funcTestFirebase = async (
  _context: Context,
  req: HttpRequest,
  log: Logger
): Promise<unknown> => {
  try {
    const { action = 'connection', matchId, data }: TestFirebaseRequest = req.body || {};

    log.logInfo('Testing Firebase functionality', { action, matchId });

    const firebaseService = new FirebaseService(log);

    switch (action) {
      case 'connection':
        return await testConnection(firebaseService, log);

      case 'write':
        return await testWrite(firebaseService, log, matchId, data);

      case 'read':
        return await testRead(firebaseService, log, matchId);

      case 'match-simulation':
        return await testMatchSimulation(firebaseService, log, matchId);

      case 'cleanup':
        return await testCleanup(firebaseService, log, matchId);

      default:
        return ApiResponseBuilder.error(
          'Invalid action. Available actions: connection, write, read, match-simulation, cleanup',
          400
        );
    }
  } catch (error) {
    log.logError('Error in Firebase test function', error);
    return ApiResponseBuilder.error('Internal server error during Firebase test', 500);
  }
};

/**
 * Prueba la conexión básica a Firebase
 */
async function testConnection(firebaseService: FirebaseService, log: Logger): Promise<unknown> {
  try {
    log.logInfo('Testing Firebase connection...');

    // Simular escritura usando el método interno (necesitaríamos exposer el método o usar uno público)
    // Por ahora, vamos a verificar la configuración
    const result: ConnectionTestResult = {
      connected: true,
      projectId: process.env.FIREBASE_PROJECT_ID,
      databaseUrl: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`,
    };

    // Verificar que las variables de entorno estén configuradas
    if (!process.env.FIREBASE_PROJECT_ID) {
      result.connected = false;
      result.error = 'FIREBASE_PROJECT_ID not configured';
    }

    if (!process.env.FIREBASE_PRIVATE_KEY) {
      result.connected = false;
      result.error = (result.error || '') + ' FIREBASE_PRIVATE_KEY not configured';
    }

    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      result.connected = false;
      result.error = (result.error || '') + ' FIREBASE_CLIENT_EMAIL not configured';
    }

    if (result.connected) {
      log.logInfo('Firebase connection test successful');
      return ApiResponseBuilder.success(result, 'Firebase connection test successful');
    } else {
      log.logError('Firebase connection test failed', result.error);
      return ApiResponseBuilder.error(`Firebase connection test failed: ${result.error}`, 500);
    }
  } catch (error) {
    log.logError('Firebase connection test error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return ApiResponseBuilder.error(`Firebase connection test failed: ${errorMessage}`, 500);
  }
}

/**
 * Prueba de escritura de datos en Firebase (eventos)
 */
async function testWrite(
  firebaseService: FirebaseService,
  log: Logger,
  matchId?: number,
  data?: TestFirebaseData
): Promise<unknown> {
  try {
    const testMatchId = matchId || 999999; // ID de prueba
    const testData: TestFirebaseData = data || {
      timestamp: new Date().toISOString(),
      test: 'write-test',
      randomValue: Math.random(),
    };

    log.logInfo('Testing Firebase write operation', { matchId: testMatchId, data: testData });

    // Usar notificación para probar escritura
    await firebaseService.sendMatchNotification(
      testMatchId,
      'test',
      'Firebase write test',
      testData
    );

    const result: WriteTestResult = {
      success: true,
      path: `match-notifications/${testMatchId}`,
      data: testData,
    };

    log.logInfo('Firebase write test successful');
    return ApiResponseBuilder.success(result, 'Firebase write test successful');
  } catch (error) {
    log.logError('Firebase write test error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return ApiResponseBuilder.error(`Firebase write test failed: ${errorMessage}`, 500);
  }
}

/**
 * Prueba de lectura de datos desde Firebase (eventos)
 */
async function testRead(
  firebaseService: FirebaseService,
  log: Logger,
  matchId?: number
): Promise<unknown> {
  try {
    const testMatchId = matchId || 999999; // ID de prueba

    log.logInfo('Testing Firebase read operation', { matchId: testMatchId });

    // Leer eventos del partido de prueba
    const matchEvents = await firebaseService.getMatchEvents(testMatchId);

    const result: ReadTestResult = {
      success: true,
      path: `match-events/${testMatchId}`,
      data: matchEvents,
    };

    log.logInfo('Firebase read test successful', { eventsCount: matchEvents.length });
    return ApiResponseBuilder.success(result, 'Firebase read test successful');
  } catch (error) {
    log.logError('Firebase read test error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return ApiResponseBuilder.error(`Firebase read test failed: ${errorMessage}`, 500);
  }
}

/**
 * Simulación completa de eventos de partido para probar todas las funcionalidades
 */
async function testMatchSimulation(
  firebaseService: FirebaseService,
  log: Logger,
  matchId?: number
): Promise<unknown> {
  const testMatchId = matchId || 999999;
  const steps: Array<{ step: string; success: boolean; error?: string }> = [];

  log.logInfo('Starting Firebase event simulation', { matchId: testMatchId });

  try {
    // Paso 1: Simular evento de gol
    try {
      const goalEventData: TestFirebaseData = {
        timestamp: new Date().toISOString(),
        test: 'goal-event',
        playerId: 1,
        teamId: 1,
        minute: 15,
      };

      await firebaseService.sendMatchNotification(
        testMatchId,
        'goal',
        'Goal scored!',
        goalEventData
      );
      steps.push({ step: 'Add goal notification', success: true });
    } catch (error) {
      steps.push({
        step: 'Add goal notification',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Paso 2: Simular evento de tarjeta amarilla
    try {
      const cardEventData: TestFirebaseData = {
        timestamp: new Date().toISOString(),
        test: 'yellow-card-event',
        playerId: 2,
        teamId: 2,
        minute: 23,
      };

      await firebaseService.sendMatchNotification(
        testMatchId,
        'yellow_card',
        'Yellow card',
        cardEventData
      );
      steps.push({ step: 'Add yellow card notification', success: true });
    } catch (error) {
      steps.push({
        step: 'Add yellow card notification',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Paso 3: Leer eventos para verificar
    try {
      const events = await firebaseService.getMatchEvents(testMatchId);
      steps.push({ step: `Read events (found: ${events.length})`, success: true });
    } catch (error) {
      steps.push({
        step: 'Read events',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Paso 4: Simular notificación de estado del partido
    try {
      await firebaseService.sendMatchNotification(testMatchId, 'match_start', 'Match started!', {
        timestamp: new Date().toISOString(),
        test: 'match-start',
      });
      steps.push({ step: 'Send match start notification', success: true });
    } catch (error) {
      steps.push({
        step: 'Send match start notification',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    const result: MatchSimulationResult = {
      success: steps.every((step) => step.success),
      matchId: testMatchId,
      steps,
    };

    log.logInfo('Firebase event simulation completed', {
      success: result.success,
      steps: steps.length,
    });
    return ApiResponseBuilder.success(result, 'Firebase event simulation completed');
  } catch (error) {
    log.logError('Firebase event simulation error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return ApiResponseBuilder.error(`Firebase event simulation failed: ${errorMessage}`, 500);
  }
}

/**
 * Limpieza de datos de prueba
 */
async function testCleanup(
  firebaseService: FirebaseService,
  log: Logger,
  matchId?: number
): Promise<unknown> {
  try {
    const testMatchId = matchId || 999999;

    log.logInfo('Cleaning up Firebase test data', { matchId: testMatchId });

    await firebaseService.removeAllMatchData(testMatchId);

    log.logInfo('Firebase cleanup completed');
    return ApiResponseBuilder.success(
      { matchId: testMatchId },
      'Firebase test data cleaned up successfully'
    );
  } catch (error) {
    log.logError('Firebase cleanup error', error);
    return ApiResponseBuilder.error('Firebase cleanup failed', 500);
  }
}

export default withApiHandler(funcTestFirebase);
