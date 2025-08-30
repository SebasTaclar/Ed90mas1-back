import { IMatchEventDataSource } from '../../domain/interfaces/IMatchEventDataSource';
import { IMatchDataSource } from '../../domain/interfaces/IMatchDataSource';
import { IMatchStatisticsDataSource } from '../../domain/interfaces/IMatchStatisticsDataSource';
import { FirebaseService } from '../../services/FirebaseService';
import {
  MatchEvent,
  CreateMatchEventRequest,
  UpdateMatchEventRequest,
  MatchEventWithRelations,
  MatchEventType,
} from '../../domain/entities/MatchEvent';
import { MatchStatus } from '../../domain/entities/Match';
import { Logger } from '../../shared/Logger';
import { ValidationError, NotFoundError } from '../../shared/exceptions';

export class MatchEventService {
  constructor(
    private matchEventDataSource: IMatchEventDataSource,
    private matchDataSource: IMatchDataSource,
    private matchStatisticsDataSource: IMatchStatisticsDataSource,
    private firebaseService: FirebaseService,
    private logger: Logger
  ) {}

  async addEvent(request: CreateMatchEventRequest): Promise<MatchEvent> {
    this.logger.logInfo('MatchEventService: Adding event', { request });

    // Validaciones básicas
    this.validateCreateEventRequest(request);

    // Verificar que el partido existe y está en progreso
    await this.validateMatchForEvent(request.matchId);

    // Crear el evento
    const event = await this.matchEventDataSource.create(request);

    // Actualizar estadísticas automáticamente basado en el evento
    await this.updateStatisticsFromEvent(event, 'add');

    // Si es gol, actualizar el marcador del partido
    if (
      request.eventType === MatchEventType.GOAL ||
      request.eventType === MatchEventType.PENALTY_GOAL ||
      request.eventType === MatchEventType.OWN_GOAL
    ) {
      await this.updateMatchScore(request.matchId);
    }

    // NUEVA FUNCIONALIDAD: Sincronizar con Firebase
    try {
      // Obtener el evento con relaciones para enviar a Firebase
      const eventWithRelations = await this.matchEventDataSource.findById(event.id);
      if (eventWithRelations) {
        await this.firebaseService.syncMatchEvent(eventWithRelations);
      }

      // Si afectó el marcador, sincronizar datos del partido
      // Ya no sincronizamos datos del partido - solo el evento específico
      // El frontend calculará el marcador desde los eventos
    } catch (firebaseError) {
      this.logger.logError(
        'Failed to sync event to Firebase, but event was created successfully',
        firebaseError
      );
      // No bloqueamos el flujo principal si Firebase falla
    }

    this.logger.logInfo('MatchEventService: Event added successfully', {
      id: event.id,
      matchId: event.matchId,
      eventType: event.eventType,
    });
    return event;
  }

  async getEventById(id: number): Promise<MatchEventWithRelations> {
    this.logger.logInfo('MatchEventService: Getting event by ID', { id });

    if (!id || id <= 0) {
      throw new ValidationError('Valid event ID is required');
    }

    const event = await this.matchEventDataSource.findById(id);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return event;
  }

  async getEventsByMatch(matchId: number): Promise<MatchEventWithRelations[]> {
    this.logger.logInfo('MatchEventService: Getting events by match', { matchId });

    if (!matchId || matchId <= 0) {
      throw new ValidationError('Valid match ID is required');
    }

    const events = await this.matchEventDataSource.findByMatch(matchId);

    this.logger.logInfo('MatchEventService: Match events retrieved successfully', {
      matchId,
      count: events.length,
    });
    return events;
  }

  async getEventsByPlayer(
    playerId: number,
    tournamentId?: number
  ): Promise<MatchEventWithRelations[]> {
    this.logger.logInfo('MatchEventService: Getting events by player', { playerId, tournamentId });

    if (!playerId || playerId <= 0) {
      throw new ValidationError('Valid player ID is required');
    }

    const events = await this.matchEventDataSource.findByPlayer(playerId, tournamentId);

    this.logger.logInfo('MatchEventService: Player events retrieved successfully', {
      playerId,
      tournamentId,
      count: events.length,
    });
    return events;
  }

  async getEventsByTeam(teamId: number, tournamentId?: number): Promise<MatchEventWithRelations[]> {
    this.logger.logInfo('MatchEventService: Getting events by team', { teamId, tournamentId });

    if (!teamId || teamId <= 0) {
      throw new ValidationError('Valid team ID is required');
    }

    const events = await this.matchEventDataSource.findByTeam(teamId, tournamentId);

    this.logger.logInfo('MatchEventService: Team events retrieved successfully', {
      teamId,
      tournamentId,
      count: events.length,
    });
    return events;
  }

  async updateEvent(id: number, request: UpdateMatchEventRequest): Promise<MatchEvent> {
    this.logger.logInfo('MatchEventService: Updating event', { id, request });

    if (!id || id <= 0) {
      throw new ValidationError('Valid event ID is required');
    }

    // Obtener evento existente
    const existingEvent = await this.matchEventDataSource.findById(id);
    if (!existingEvent) {
      throw new NotFoundError('Event not found');
    }

    // Verificar que el partido aún permite modificaciones
    const match = await this.matchDataSource.findById(existingEvent.matchId);
    if (!match) {
      throw new NotFoundError('Associated match not found');
    }

    if (match.status === MatchStatus.FINISHED) {
      throw new ValidationError('Cannot modify events of finished matches');
    }

    // Revertir estadísticas del evento anterior
    await this.updateStatisticsFromEvent(existingEvent, 'remove');

    // Actualizar evento
    const updatedEvent = await this.matchEventDataSource.update(id, request);
    if (!updatedEvent) {
      throw new NotFoundError('Failed to update event');
    }

    // Aplicar estadísticas del evento actualizado
    const eventWithNewData = { ...existingEvent, ...request };
    await this.updateStatisticsFromEvent(eventWithNewData, 'add');

    // Si cambió el tipo de evento y afecta el marcador, actualizar
    const affectsScore = [
      MatchEventType.GOAL,
      MatchEventType.PENALTY_GOAL,
      MatchEventType.OWN_GOAL,
    ];
    if (
      affectsScore.includes(existingEvent.eventType as MatchEventType) ||
      (request.eventType && affectsScore.includes(request.eventType))
    ) {
      await this.updateMatchScore(existingEvent.matchId);
    }

    // NUEVA FUNCIONALIDAD: Sincronizar con Firebase
    try {
      // Obtener el evento actualizado con relaciones
      const eventWithRelations = await this.matchEventDataSource.findById(id);
      if (eventWithRelations) {
        await this.firebaseService.syncMatchEvent(eventWithRelations);
      }

      // Ya no sincronizamos datos del partido después de actualizar eventos
      // Solo el evento actualizado es sincronizado arriba
    } catch (firebaseError) {
      this.logger.logError('Failed to sync updated event to Firebase', firebaseError);
      // No bloqueamos el flujo principal si Firebase falla
    }

    this.logger.logInfo('MatchEventService: Event updated successfully', { id });
    return updatedEvent;
  }

  async removeEvent(id: number): Promise<boolean> {
    this.logger.logInfo('MatchEventService: Removing event', { id });

    if (!id || id <= 0) {
      throw new ValidationError('Valid event ID is required');
    }

    // Obtener evento existente
    const existingEvent = await this.matchEventDataSource.findById(id);
    if (!existingEvent) {
      throw new NotFoundError('Event not found');
    }

    // Verificar que el partido aún permite modificaciones
    const match = await this.matchDataSource.findById(existingEvent.matchId);
    if (!match) {
      throw new NotFoundError('Associated match not found');
    }

    // Revertir estadísticas del evento
    await this.updateStatisticsFromEvent(existingEvent, 'remove');

    // Eliminar evento
    const deleted = await this.matchEventDataSource.delete(id);

    // Si el evento afectaba el marcador, actualizar
    const affectsScore = [
      MatchEventType.GOAL,
      MatchEventType.PENALTY_GOAL,
      MatchEventType.OWN_GOAL,
    ];
    if (affectsScore.includes(existingEvent.eventType as MatchEventType)) {
      await this.updateMatchScore(existingEvent.matchId);
    }

    // NUEVA FUNCIONALIDAD: Sincronizar con Firebase
    try {
      // Remover el evento de Firebase
      await this.firebaseService.removeMatchEvent(existingEvent.matchId, id);

      // Ya no sincronizamos datos del partido después de eliminar eventos
      // El frontend calculará el marcador desde los eventos restantes
    } catch (firebaseError) {
      this.logger.logError('Failed to sync event deletion to Firebase', firebaseError);
      // No bloqueamos el flujo principal si Firebase falla
    }

    this.logger.logInfo('MatchEventService: Event removed successfully', { id });
    return deleted;
  }

  async getEventsByType(
    eventType: MatchEventType,
    matchId?: number,
    tournamentId?: number
  ): Promise<MatchEventWithRelations[]> {
    this.logger.logInfo('MatchEventService: Getting events by type', {
      eventType,
      matchId,
      tournamentId,
    });

    const events = await this.matchEventDataSource.findByEventType(
      eventType,
      matchId,
      tournamentId
    );

    this.logger.logInfo('MatchEventService: Events by type retrieved successfully', {
      eventType,
      matchId,
      tournamentId,
      count: events.length,
    });
    return events;
  }

  async getEventsInTimeRange(
    matchId: number,
    startMinute: number,
    endMinute: number
  ): Promise<MatchEventWithRelations[]> {
    this.logger.logInfo('MatchEventService: Getting events in time range', {
      matchId,
      startMinute,
      endMinute,
    });

    if (!matchId || matchId <= 0) {
      throw new ValidationError('Valid match ID is required');
    }

    if (startMinute < 0 || endMinute < 0 || startMinute >= endMinute) {
      throw new ValidationError('Invalid time range');
    }

    const events = await this.matchEventDataSource.getEventsInTimeRange(
      matchId,
      startMinute,
      endMinute
    );

    this.logger.logInfo('MatchEventService: Events in time range retrieved successfully', {
      matchId,
      startMinute,
      endMinute,
      count: events.length,
    });
    return events;
  }

  private validateCreateEventRequest(request: CreateMatchEventRequest): void {
    if (!request.matchId || request.matchId <= 0) {
      throw new ValidationError('Valid match ID is required');
    }

    if (!request.playerId || request.playerId <= 0) {
      throw new ValidationError('Valid player ID is required');
    }

    if (!request.teamId || request.teamId <= 0) {
      throw new ValidationError('Valid team ID is required');
    }

    if (!request.eventType) {
      throw new ValidationError('Event type is required');
    }

    if (request.minute < 0 || request.minute > 120) {
      throw new ValidationError('Minute must be between 0 and 120');
    }

    if (request.extraTime && (request.extraTime < 0 || request.extraTime > 30)) {
      throw new ValidationError('Extra time must be between 0 and 30');
    }

    // Validar asistencia solo para goles
    if (
      request.assistPlayerId &&
      ![MatchEventType.GOAL, MatchEventType.PENALTY_GOAL].includes(request.eventType)
    ) {
      throw new ValidationError('Assist player can only be specified for goals');
    }
  }

  private async validateMatchForEvent(matchId: number): Promise<void> {
    const match = await this.matchDataSource.findById(matchId);
    if (!match) {
      throw new NotFoundError('Match not found');
    }

    // Validación de estado removida - se pueden agregar eventos a partidos en cualquier estado
  }

  private async updateStatisticsFromEvent(
    event: MatchEvent | MatchEventWithRelations,
    operation: 'add' | 'remove'
  ): Promise<void> {
    const multiplier = operation === 'add' ? 1 : -1;

    try {
      switch (event.eventType) {
        case MatchEventType.GOAL:
        case MatchEventType.PENALTY_GOAL:
          // Actualizar gol del jugador
          await this.matchStatisticsDataSource.upsert(event.matchId, event.playerId, {
            goals: multiplier,
          });

          // Actualizar asistencia si existe
          if (event.assistPlayerId) {
            await this.matchStatisticsDataSource.upsert(event.matchId, event.assistPlayerId, {
              assists: multiplier,
            });
          }
          break;

        case MatchEventType.OWN_GOAL:
          // Los goles en contra no se cuentan como estadística positiva del jugador
          // Se podría implementar una estadística específica si se requiere
          break;

        case MatchEventType.YELLOW_CARD:
          await this.matchStatisticsDataSource.upsert(event.matchId, event.playerId, {
            yellowCards: multiplier,
          });
          break;

        case MatchEventType.RED_CARD:
          await this.matchStatisticsDataSource.upsert(event.matchId, event.playerId, {
            redCards: multiplier,
          });
          break;

        default:
          // Otros tipos de eventos no afectan estadísticas automáticamente
          break;
      }
    } catch (error) {
      this.logger.logError('Error updating statistics from event', {
        error,
        eventId: event.id,
        eventType: event.eventType,
        operation,
      });
      // No lanzar error para no bloquear la creación del evento
    }
  }

  private async updateMatchScore(matchId: number): Promise<void> {
    try {
      // Contar goles por equipo basado en eventos
      const goals = await this.matchEventDataSource.findByEventType(MatchEventType.GOAL, matchId);
      const penaltyGoals = await this.matchEventDataSource.findByEventType(
        MatchEventType.PENALTY_GOAL,
        matchId
      );
      const ownGoals = await this.matchEventDataSource.findByEventType(
        MatchEventType.OWN_GOAL,
        matchId
      );

      const match = await this.matchDataSource.findById(matchId);
      if (!match) return;

      // Contar goles del equipo local
      let homeScore = 0;
      let awayScore = 0;

      // Goles normales y penales
      [...goals, ...penaltyGoals].forEach((goal) => {
        if (goal.teamId === match.homeTeamId) {
          homeScore++;
        } else if (goal.teamId === match.awayTeamId) {
          awayScore++;
        }
      });

      // Goles en contra (se suman al equipo contrario)
      ownGoals.forEach((ownGoal) => {
        if (ownGoal.teamId === match.homeTeamId) {
          awayScore++; // Gol en contra del local suma al visitante
        } else if (ownGoal.teamId === match.awayTeamId) {
          homeScore++; // Gol en contra del visitante suma al local
        }
      });

      // Actualizar marcador del partido
      await this.matchDataSource.update(matchId, {
        homeScore,
        awayScore,
      });

      this.logger.logInfo('Match score updated from events', {
        matchId,
        homeScore,
        awayScore,
      });
    } catch (error) {
      this.logger.logError('Error updating match score from events', {
        error,
        matchId,
      });
    }
  }
}
