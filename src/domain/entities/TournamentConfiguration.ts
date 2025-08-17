export type TournamentConfiguration = {
  id: number;
  tournamentId: number;
  numberOfGroups: number;
  teamsPerGroup: number;
  isConfigured: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTournamentConfigurationRequest = {
  tournamentId: number;
  numberOfGroups: number;
  teamsPerGroup: number;
};

export type UpdateTournamentConfigurationRequest = {
  numberOfGroups?: number;
  teamsPerGroup?: number;
  isConfigured?: boolean;
};
