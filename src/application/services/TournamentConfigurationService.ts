import { Logger } from '../../shared/Logger';
import { ValidationError } from '../../shared/exceptions';
import { ITournamentConfigurationDataSource } from '../../domain/interfaces/ITournamentConfigurationDataSource';
import {
  TournamentConfiguration,
  CreateTournamentConfigurationRequest,
  UpdateTournamentConfigurationRequest,
} from '../../domain/entities/TournamentConfiguration';
import { ConfigureTournamentRequest } from '../../domain/entities/TeamGroupAssignment';

export class TournamentConfigurationService {
  private logger: Logger;
  private tournamentConfigDataSource: ITournamentConfigurationDataSource;

  constructor(logger: Logger, tournamentConfigDataSource: ITournamentConfigurationDataSource) {
    this.logger = logger;
    this.tournamentConfigDataSource = tournamentConfigDataSource;
  }

  async configureTournament(request: ConfigureTournamentRequest): Promise<{
    configuration: TournamentConfiguration;
    groups: any[];
    assignments: any[];
  }> {
    this.logger.logInfo(`Configuring tournament: ${request.tournamentId}`);

    // Validate input
    if (!request.tournamentId || request.numberOfGroups <= 0 || request.teamsPerGroup <= 0) {
      throw new ValidationError(
        'Tournament ID, number of groups, and teams per group are required and must be positive'
      );
    }

    if (request.numberOfGroups > 26) {
      throw new ValidationError('Maximum 26 groups allowed (A-Z)');
    }

    try {
      const result = await this.tournamentConfigDataSource.configureTournament(request);

      this.logger.logInfo(
        `Tournament ${request.tournamentId} configured successfully with ${result.groups.length} groups`
      );

      return result;
    } catch (error) {
      this.logger.logError(`Error configuring tournament ${request.tournamentId}:`, error);
      throw error;
    }
  }

  async getTournamentConfiguration(tournamentId: number): Promise<{
    configuration: TournamentConfiguration | null;
    groups: any[];
    assignments: any[];
  }> {
    this.logger.logInfo(`Getting configuration for tournament: ${tournamentId}`);

    if (!tournamentId) {
      throw new ValidationError('Tournament ID is required');
    }

    try {
      const [configuration, groups, assignments] = await Promise.all([
        this.tournamentConfigDataSource.getConfigurationByTournamentId(tournamentId),
        this.tournamentConfigDataSource.getGroupsByTournamentId(tournamentId),
        this.tournamentConfigDataSource.getAssignmentsByTournamentId(tournamentId),
      ]);

      return {
        configuration,
        groups,
        assignments,
      };
    } catch (error) {
      this.logger.logError(`Error getting tournament configuration for ${tournamentId}:`, error);
      throw error;
    }
  }

  async updateTournamentConfiguration(
    configurationId: number,
    request: UpdateTournamentConfigurationRequest
  ): Promise<TournamentConfiguration | null> {
    this.logger.logInfo(`Updating tournament configuration: ${configurationId}`);

    if (!configurationId) {
      throw new ValidationError('Configuration ID is required');
    }

    if (request.numberOfGroups !== undefined && request.numberOfGroups <= 0) {
      throw new ValidationError('Number of groups must be positive');
    }

    if (request.teamsPerGroup !== undefined && request.teamsPerGroup <= 0) {
      throw new ValidationError('Teams per group must be positive');
    }

    try {
      const updatedConfig = await this.tournamentConfigDataSource.updateConfiguration(
        configurationId,
        request
      );

      if (updatedConfig) {
        this.logger.logInfo(`Tournament configuration ${configurationId} updated successfully`);
      } else {
        this.logger.logWarning(`Tournament configuration ${configurationId} not found`);
      }

      return updatedConfig;
    } catch (error) {
      this.logger.logError(`Error updating tournament configuration ${configurationId}:`, error);
      throw error;
    }
  }

  async deleteTournamentConfiguration(tournamentId: number): Promise<boolean> {
    this.logger.logInfo(`Deleting tournament configuration for tournament: ${tournamentId}`);

    if (!tournamentId || tournamentId <= 0) {
      throw new ValidationError('Valid tournament ID is required');
    }

    try {
      // Verificar que la configuración existe
      const existingConfig =
        await this.tournamentConfigDataSource.getConfigurationByTournamentId(tournamentId);

      if (!existingConfig) {
        throw new ValidationError(
          `Tournament configuration not found for tournament ${tournamentId}`
        );
      }

      // Eliminar assignments, grupos y configuración
      await this.tournamentConfigDataSource.deleteAssignmentsByTournamentId(tournamentId);
      await this.tournamentConfigDataSource.deleteGroupsByTournamentId(tournamentId);

      // Eliminar la configuración principal
      const deleted =
        await this.tournamentConfigDataSource.deleteConfigurationByTournamentId(tournamentId);

      this.logger.logInfo(
        `Tournament configuration deleted successfully for tournament: ${tournamentId}`
      );
      return deleted;
    } catch (error) {
      this.logger.logError(`Error deleting tournament configuration for ${tournamentId}:`, error);
      throw error;
    }
  }
}
