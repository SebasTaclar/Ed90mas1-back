import {
  Player,
  CreatePlayerRequest,
  UpdatePlayerRequest,
  PlayerWithTeam,
} from '../entities/Player';

export interface IPlayerDataSource {
  create(player: CreatePlayerRequest): Promise<Player>;
  findById(id: number): Promise<PlayerWithTeam | null>;
  findAll(): Promise<PlayerWithTeam[]>;
  findByTeam(teamId: number): Promise<PlayerWithTeam[]>;
  update(id: number, player: UpdatePlayerRequest): Promise<Player>;
  delete(id: number): Promise<void>;
  findByEmail(email: string): Promise<Player | null>;
  findByJerseyNumberInTeam(teamId: number, jerseyNumber: number): Promise<Player | null>;
}
