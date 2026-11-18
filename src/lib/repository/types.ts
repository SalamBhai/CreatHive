import type {
  CreativeProfile,
  CreativePiece,
  PerformanceInquiry,
  InquiryStatus,
  CreativeDiscipline,
} from '@/lib/types';
import type { JoinRequest } from '@/lib/store-types';

export type NewPiece = Omit<CreativePiece, 'id' | 'createdAt' | 'applauseCount'>;
export type NewInquiry = Omit<PerformanceInquiry, 'id' | 'createdAt' | 'status'>;
export type NewJoinRequest = Omit<JoinRequest, 'id' | 'status' | 'createdAt'>;

/** The single boundary the UI talks to. Local + Supabase implementations live behind it. */
export interface DataRepository {
  // Profiles
  listProfiles(): Promise<CreativeProfile[]>;
  getProfile(username: string): Promise<CreativeProfile | undefined>;
  createProfile(profile: CreativeProfile): Promise<CreativeProfile>;
  updateProfile(username: string, patch: Partial<CreativeProfile>): Promise<CreativeProfile>;

  // Pieces
  listPieces(options?: { creativeId?: string; discipline?: CreativeDiscipline | 'ALL'; includeDrafts?: boolean }): Promise<CreativePiece[]>;
  /** Fetch one piece regardless of visibility (RLS still hides others' drafts). */
  getPiece(id: string): Promise<CreativePiece | undefined>;
  addPiece(piece: NewPiece): Promise<CreativePiece>;
  updatePiece(id: string, patch: Partial<CreativePiece>): Promise<CreativePiece>;
  deletePiece(id: string): Promise<string>;
  reorderPieces(ids: string[]): Promise<string[]>;
  applaudPiece(id: string): Promise<string>;

  // Inquiries (creator-scoped)
  listInquiries(creativeId?: string): Promise<PerformanceInquiry[]>;
  sendInquiry(inquiry: NewInquiry): Promise<PerformanceInquiry>;
  updateInquiryStatus(id: string, status: InquiryStatus): Promise<string>;

  // Admin: join requests
  listJoinRequests(): Promise<JoinRequest[]>;
  submitJoinRequest(request: NewJoinRequest): Promise<JoinRequest>;
}
