export type TournamentGroup = {
  id: number;
  tournamentId: number;
  groupName: string;
  groupOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTournamentGroupRequest = {
  tournamentId: number;
  groupName: string;
  groupOrder: number;
};
