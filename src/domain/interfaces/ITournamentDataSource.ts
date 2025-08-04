import {
  Tournament,
  CreateTournamentRequest,
  UpdateTournamentRequest,
} from '../entities/Tournament';

export interface ITournamentDataSource {
  create(tournament: CreateTournamentRequest): Promise<Tournament>;
  findById(id: number): Promise<Tournament | null>;
  findAll(): Promise<Tournament[]>;
  findByCategory(categoryId: number): Promise<Tournament[]>;
  update(id: number, tournament: UpdateTournamentRequest): Promise<Tournament>;
  delete(id: number): Promise<void>;
  addCategories(tournamentId: number, categoryIds: number[]): Promise<void>;
  removeCategories(tournamentId: number, categoryIds: number[]): Promise<void>;
}
