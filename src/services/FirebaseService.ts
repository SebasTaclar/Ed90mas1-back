import * as admin from 'firebase-admin';
import { Logger } from '../shared/Logger';
import { MatchEventWithRelations } from '../domain/entities/MatchEvent';

export interface FirebaseMatchEvent {
  id: number;
  matchId: number;
  playerId: number;
  teamId: number;
  eventType: string;
  minute: number;
  extraTime?: number;
  description?: string;
  assistPlayerId?: number;
  createdAt: string;
  // Datos enriquecidos para el frontend
  playerName?: string;
  teamName?: string;
  assistPlayerName?: string;
}

export class FirebaseService {
  private db: admin.database.Database;
  private initialized = false;

  constructor(private logger: Logger) {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      if (this.initialized) return;

      // Verificar si ya existe una app inicializada
      let app: admin.app.App;
      try {
        app = admin.app();
      } catch (error) {
        // Si no existe, crear una nueva
        const serviceAccount = {
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        };

        app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`,
        });
      }

      this.db = admin.database();
      this.initialized = true;
      this.logger.logInfo('Firebase initialized successfully');
    } catch (error) {
      this.logger.logError('Failed to initialize Firebase', error);
      throw error;
    }
  }

  /**
   * Sincroniza un evento de partido a Firebase para tiempo real
   * Este es el método principal - solo sincroniza eventos
   */
  async syncMatchEvent(event: MatchEventWithRelations): Promise<void> {
    try {
      const firebaseEvent: FirebaseMatchEvent = {
        id: event.id,
        matchId: event.matchId,
        playerId: event.playerId,
        teamId: event.teamId,
        eventType: event.eventType,
        minute: event.minute,
        extraTime: event.extraTime,
        description: event.description,
        assistPlayerId: event.assistPlayerId,
        createdAt: event.createdAt.toISOString(),
        // Datos enriquecidos para el frontend
        playerName: event.player ? `${event.player.firstName} ${event.player.lastName}` : undefined,
        teamName: event.team?.name,
        assistPlayerName: event.assistPlayer
          ? `${event.assistPlayer.firstName} ${event.assistPlayer.lastName}`
          : undefined,
      };

      // Estructura: match-events/matchId/eventId
      const eventRef = this.db.ref(`match-events/${event.matchId}/${event.id}`);
      await eventRef.set(firebaseEvent);

      this.logger.logInfo('Event synced to Firebase', {
        eventId: event.id,
        matchId: event.matchId,
        eventType: event.eventType,
      });
    } catch (error) {
      this.logger.logError('Failed to sync event to Firebase', error);
      // No relanzar el error para no bloquear el flujo principal
    }
  }

  /**
   * Elimina un evento de Firebase
   */
  async removeMatchEvent(matchId: number, eventId: number): Promise<void> {
    try {
      const eventRef = this.db.ref(`match-events/${matchId}/${eventId}`);
      await eventRef.remove();

      this.logger.logInfo('Event removed from Firebase', {
        eventId,
        matchId,
      });
    } catch (error) {
      this.logger.logError('Failed to remove event from Firebase', error);
    }
  }

  /**
   * Obtiene todos los eventos de un partido desde Firebase
   */
  async getMatchEvents(matchId: number): Promise<FirebaseMatchEvent[]> {
    try {
      const eventsRef = this.db.ref(`match-events/${matchId}`);
      const snapshot = await eventsRef.once('value');
      const eventsData = snapshot.val();

      if (!eventsData) {
        return [];
      }

      // Convertir objeto a array y ordenar por minuto
      const events: FirebaseMatchEvent[] = Object.values(eventsData);
      return events.sort((a, b) => {
        if (a.minute === b.minute) {
          return (a.extraTime || 0) - (b.extraTime || 0);
        }
        return a.minute - b.minute;
      });
    } catch (error) {
      this.logger.logError('Failed to get match events from Firebase', error);
      return [];
    }
  }

  /**
   * Limpia todos los eventos de un partido
   */
  async clearMatchEvents(matchId: number): Promise<void> {
    try {
      const eventsRef = this.db.ref(`match-events/${matchId}`);
      await eventsRef.remove();

      this.logger.logInfo('Match events cleared from Firebase', { matchId });
    } catch (error) {
      this.logger.logError('Failed to clear match events from Firebase', error);
    }
  }

  /**
   * Envía una notificación personalizada (para casos especiales como cambios de estado)
   */
  async sendMatchNotification(
    matchId: number,
    type: string,
    message: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    try {
      const notificationRef = this.db.ref(`match-notifications/${matchId}`).push();
      await notificationRef.set({
        type,
        message,
        data: data || {},
        timestamp: new Date().toISOString(),
        id: notificationRef.key,
      });

      this.logger.logInfo('Match notification sent via Firebase', { matchId, type, message });
    } catch (error) {
      this.logger.logError('Failed to send match notification via Firebase', error);
    }
  }

  /**
   * Elimina todas las notificaciones de un partido
   */
  async clearMatchNotifications(matchId: number): Promise<void> {
    try {
      const notificationsRef = this.db.ref(`match-notifications/${matchId}`);
      await notificationsRef.remove();

      this.logger.logInfo('Match notifications cleared from Firebase', { matchId });
    } catch (error) {
      this.logger.logError('Failed to clear match notifications from Firebase', error);
    }
  }

  /**
   * Elimina todos los datos de un partido de Firebase (eventos + notificaciones)
   */
  async removeAllMatchData(matchId: number): Promise<void> {
    try {
      // Eliminar eventos
      await this.clearMatchEvents(matchId);

      // Eliminar notificaciones
      await this.clearMatchNotifications(matchId);

      this.logger.logInfo('All match data removed from Firebase', { matchId });
    } catch (error) {
      this.logger.logError('Failed to remove all match data from Firebase', error);
    }
  }
}
