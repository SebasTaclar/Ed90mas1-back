export interface Player {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: Date;
  position?: string;
  jerseyNumber?: number;
  isActive: boolean;
  teamId: number;
  profilePhotoPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePlayerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: Date;
  position?: string;
  jerseyNumber?: number;
  teamId: number;
  profilePhotoPath?: string;
}

export interface UpdatePlayerRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  position?: string;
  jerseyNumber?: number;
  isActive?: boolean;
  teamId?: number;
  profilePhotoPath?: string;
}

export interface PlayerWithTeam extends Player {
  team: {
    id: number;
    name: string;
    logoPath?: string;
  };
}
