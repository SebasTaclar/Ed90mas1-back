import {
  TournamentConfiguration,
  CreateTournamentConfigurationRequest,
  UpdateTournamentConfigurationRequest,
} from '../entities/TournamentConfiguration';
import { TournamentGroup, CreateTournamentGroupRequest } from '../entities/TournamentGroup';
import {
  TeamGroupAssignment,
  CreateTeamGroupAssignmentRequest,
  ConfigureTournamentRequest,
} from '../entities/TeamGroupAssignment';

export interface ITournamentConfigurationDataSource {
  // Tournament Configuration
  getConfigurationByTournamentId(tournamentId: number): Promise<TournamentConfiguration | null>;
  createConfiguration(
    request: CreateTournamentConfigurationRequest
  ): Promise<TournamentConfiguration>;
  updateConfiguration(
    id: number,
    request: UpdateTournamentConfigurationRequest
  ): Promise<TournamentConfiguration | null>;
  deleteConfigurationByTournamentId(tournamentId: number): Promise<boolean>;

  // Tournament Groups
  getGroupsByTournamentId(tournamentId: number): Promise<TournamentGroup[]>;
  createGroup(request: CreateTournamentGroupRequest): Promise<TournamentGroup>;
  deleteGroupsByTournamentId(tournamentId: number): Promise<boolean>;

  // Team Group Assignments
  getAssignmentsByTournamentId(tournamentId: number): Promise<TeamGroupAssignment[]>;
  createAssignment(request: CreateTeamGroupAssignmentRequest): Promise<TeamGroupAssignment>;
  deleteAssignmentsByTournamentId(tournamentId: number): Promise<boolean>;

  // Full Tournament Configuration
  configureTournament(request: ConfigureTournamentRequest): Promise<{
    configuration: TournamentConfiguration;
    groups: TournamentGroup[];
    assignments: TeamGroupAssignment[];
  }>;
}
