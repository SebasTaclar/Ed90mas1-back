import {
  MatchEvent,
  CreateMatchEventRequest,
  UpdateMatchEventRequest,
  MatchEventWithRelations,
} from '../entities/MatchEvent';

export interface IMatchEventDataSource {
  // CRUD básico de eventos
  create(request: CreateMatchEventRequest): Promise<MatchEvent>;
  findById(id: number): Promise<MatchEventWithRelations | null>;
  findByMatch(matchId: number): Promise<MatchEventWithRelations[]>;
  findByPlayer(playerId: number, tournamentId?: number): Promise<MatchEventWithRelations[]>;
  findByTeam(teamId: number, tournamentId?: number): Promise<MatchEventWithRelations[]>;
  update(id: number, request: UpdateMatchEventRequest): Promise<MatchEvent | null>;
  delete(id: number): Promise<boolean>;

  // Operaciones específicas
  deleteByMatch(matchId: number): Promise<boolean>;
  findByEventType(
    eventType: string,
    matchId?: number,
    tournamentId?: number
  ): Promise<MatchEventWithRelations[]>;
  getEventsInTimeRange(
    matchId: number,
    startMinute: number,
    endMinute: number
  ): Promise<MatchEventWithRelations[]>;
}
