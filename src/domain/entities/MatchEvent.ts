export interface MatchEvent {
  id: number;
  matchId: number;
  playerId: number;
  teamId: number;
  eventType: MatchEventType;
  minute: number;
  extraTime?: number;
  description?: string;
  assistPlayerId?: number;
  createdAt: Date;
}

export enum MatchEventType {
  GOAL = 'goal',
  YELLOW_CARD = 'yellow_card',
  RED_CARD = 'red_card',
  SUBSTITUTION = 'substitution',
  OWN_GOAL = 'own_goal',
  PENALTY_GOAL = 'penalty_goal',
  PENALTY_MISS = 'penalty_miss',
}

export interface CreateMatchEventRequest {
  matchId: number;
  playerId: number;
  teamId: number;
  eventType: MatchEventType;
  minute: number;
  extraTime?: number;
  description?: string;
  assistPlayerId?: number;
}

export interface UpdateMatchEventRequest {
  eventType?: MatchEventType;
  minute?: number;
  extraTime?: number;
  description?: string;
  assistPlayerId?: number;
}

export interface MatchEventWithRelations extends MatchEvent {
  match?: {
    id: number;
    homeTeamId: number;
    awayTeamId: number;
  };
  player: {
    id: number;
    firstName: string;
    lastName: string;
    jerseyNumber?: number;
  };
  team: {
    id: number;
    name: string;
  };
  assistPlayer?: {
    id: number;
    firstName: string;
    lastName: string;
    jerseyNumber?: number;
  };
}
