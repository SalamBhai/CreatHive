export interface JoinRequest {
  id: string;
  handle: string;
  displayName: string;
  email: string;
  tagline: string;
  status: 'PENDING' | 'APPROVED';
  createdAt: string;
}
