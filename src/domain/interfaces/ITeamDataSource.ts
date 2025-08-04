import { Team, CreateTeamRequest, UpdateTeamRequest, TeamWithRelations } from '../entities/Team';

export interface ITeamDataSource {
  create(team: CreateTeamRequest): Promise<TeamWithRelations>;
  findById(id: number): Promise<TeamWithRelations | null>;
  findByUserId(userId: number): Promise<Team | null>; // Cambiado a singular porque solo puede haber uno
  findAll(): Promise<TeamWithRelations[]>;
  findByTournament(tournamentId: number): Promise<TeamWithRelations[]>;
  update(id: number, team: UpdateTeamRequest): Promise<Team>;
  delete(id: number): Promise<void>;
  addToTournaments(teamId: number, tournamentIds: number[]): Promise<void>;
  removeFromTournaments(teamId: number, tournamentIds: number[]): Promise<void>;
}
