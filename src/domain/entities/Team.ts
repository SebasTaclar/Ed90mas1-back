export interface Team {
  id: number;
  name: string;
  logoPath?: string;
  userId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTeamRequest {
  name: string;
  logoPath?: string; // Ruta opcional del logo
  userEmail: string; // Email del usuario a crear
  userPassword: string; // Password del usuario a crear
  userName: string; // Nombre del usuario a crear
  tournamentIds: number[]; // IDs de los torneos a los que se unirá
}

export interface UpdateTeamRequest {
  name?: string;
  logoPath?: string;
  isActive?: boolean;
  tournamentIds?: number[];
}

export interface TeamWithRelations extends Team {
  user: {
    id: number;
    email: string;
    name: string;
  };
  tournaments: {
    id: number;
    name: string;
    startDate: Date;
    endDate: Date;
  }[];
}
