import {
  Match,
  CreateMatchRequest,
  UpdateMatchRequest,
  GenerateFixtureRequest,
  MatchWithRelations,
} from '../entities/Match';

export interface IMatchDataSource {
  // CRUD básico de partidos
  create(request: CreateMatchRequest): Promise<Match>;
  findById(id: number): Promise<MatchWithRelations | null>;
  findAll(): Promise<MatchWithRelations[]>;
  findByTournament(tournamentId: number): Promise<MatchWithRelations[]>;
  findByGroup(groupId: number): Promise<MatchWithRelations[]>;
  findByTeam(teamId: number, tournamentId?: number): Promise<MatchWithRelations[]>;
  update(id: number, request: UpdateMatchRequest): Promise<Match | null>;
  delete(id: number): Promise<boolean>;

  // Operaciones específicas para fixture
  generateFixture(request: GenerateFixtureRequest): Promise<Match[]>;
  deleteByTournament(tournamentId: number): Promise<boolean>;
  getNextMatchNumber(tournamentId: number): Promise<number>;

  // Consultas específicas
  findByStatus(status: string, tournamentId?: number): Promise<MatchWithRelations[]>;
  findByDateRange(
    startDate: Date,
    endDate: Date,
    tournamentId?: number
  ): Promise<MatchWithRelations[]>;
  findUpcomingMatches(teamId?: number, limit?: number): Promise<MatchWithRelations[]>;
}
