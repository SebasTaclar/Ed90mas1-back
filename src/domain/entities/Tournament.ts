export interface Tournament {
  id: number;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  maxTeams: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTournamentRequest {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  maxTeams: number;
  categoryIds: number[]; // IDs de las categorías asociadas
}

export interface UpdateTournamentRequest {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  maxTeams?: number;
  isActive?: boolean;
  categoryIds?: number[];
}
