import type {
  CreativeProfile,
  CreativePiece,
  PerformanceInquiry,
  InquiryStatus,
  CreativeDiscipline,
  Campaign,
  CampaignStatus,
  Submission,
  SubmissionStatus,
  ContentFlag,
  FlagStatus,
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
  /** Admin-only: grant/revoke another user's admin status via a server RPC. */
  setProfileAdmin(id: string, makeAdmin: boolean): Promise<void>;

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
  updateJoinRequestStatus(id: string, status: JoinRequest['status']): Promise<string>;

  // Admin: cross-creator views
  listAllPieces(): Promise<CreativePiece[]>;
  listAllInquiries(): Promise<PerformanceInquiry[]>;

  // Campaigns and submissions
  listCampaigns(): Promise<Campaign[]>;
  createCampaign(campaign: Omit<Campaign, 'id' | 'createdAt'>): Promise<Campaign>;
  updateCampaignStatus(id: string, status: CampaignStatus): Promise<string>;
  listSubmissions(): Promise<Submission[]>;
  createSubmission(submission: Omit<Submission, 'id' | 'createdAt' | 'status'>): Promise<Submission>;
  updateSubmissionStatus(id: string, status: SubmissionStatus): Promise<string>;

  // Moderation
  listFlags(): Promise<ContentFlag[]>;
  createFlag(flag: Omit<ContentFlag, 'id' | 'createdAt' | 'status'>): Promise<ContentFlag>;
  updateFlagStatus(id: string, status: FlagStatus): Promise<string>;
}
