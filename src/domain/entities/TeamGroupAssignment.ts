export type TeamGroupAssignment = {
  id: number;
  tournamentId: number;
  teamId: number;
  groupId: number;
  assignedAt: Date;
};

export type CreateTeamGroupAssignmentRequest = {
  tournamentId: number;
  teamId: number;
  groupId: number;
};

export type ConfigureTournamentRequest = {
  tournamentId: number;
  numberOfGroups: number;
  teamsPerGroup: number;
  teamAssignments?: { teamId: number; groupName: string }[];
};
