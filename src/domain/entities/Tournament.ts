export interface Tournament {
  id: number;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  maxTeams: number;
  isActive: boolean;
  bannerPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTournamentRequest {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  maxTeams: number;
  bannerPath?: string;
  categoryIds: number[]; // IDs de las categorías asociadas
}

export interface UpdateTournamentRequest {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  maxTeams?: number;
  isActive?: boolean;
  bannerPath?: string;
  categoryIds?: number[];
}
