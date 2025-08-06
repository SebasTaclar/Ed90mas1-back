export type User = {
  id: number;
  email: string;
  password: string;
  name: string;
  role: string;
  membershipPaid: boolean;
  teamId?: number; // Para usuarios con rol 'team'
};
