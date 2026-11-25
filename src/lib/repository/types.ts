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
  AuditLogEntry,
} from '@/lib/types';

export const ADMIN_PAGE_SIZE = 20;

export interface PageOptions {
  page: number;
  pageSize: number;
}

export interface Paged<T> {
  items: T[];
  total: number;
}

export interface SystemLogEntry {
  id: string;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
  context?: Record<string, unknown>;
  createdAt: string;
}

export interface AdminStats {
  liveCreators: number;
  pieces: number;
  openCampaigns: number;
  submissions: number;
  openFlags: number;
  applause: number;
}

export type NewPiece = Omit<CreativePiece, 'id' | 'createdAt' | 'applauseCount'>;
export type NewInquiry = Omit<PerformanceInquiry, 'id' | 'createdAt' | 'status'>;

/** The single boundary the UI talks to. Local + Supabase implementations live behind it. */
export interface DataRepository {
  // Profiles
  listProfiles(): Promise<CreativeProfile[]>;
  getProfile(username: string): Promise<CreativeProfile | undefined>;
  createProfile(profile: CreativeProfile): Promise<CreativeProfile>;
  updateProfile(username: string, patch: Partial<CreativeProfile>): Promise<CreativeProfile>;
  /** Admin-only: grant/revoke another user's admin status via a server RPC. */
  setProfileAdmin(id: string, makeAdmin: boolean): Promise<void>;
  /** Record an admin action in the audit log (actor derived from auth.uid()). */
  logAdminAction(action: string, target?: string, meta?: Record<string, unknown>): Promise<void>;
  listAuditLog(): Promise<AuditLogEntry[]>;

  // Pieces
  listPieces(options?: { creativeId?: string; discipline?: CreativeDiscipline | 'ALL'; includeDrafts?: boolean }): Promise<CreativePiece[]>;
  /** Fetch one piece regardless of visibility (RLS still hides others' drafts). */
  getPiece(id: string): Promise<CreativePiece | undefined>;
  addPiece(piece: NewPiece): Promise<CreativePiece>;
  updatePiece(id: string, patch: Partial<CreativePiece>): Promise<CreativePiece>;
  deletePiece(id: string): Promise<string>;
  reorderPieces(ids: string[]): Promise<string[]>;
  /** Returns the authoritative new applause count. */
  applaudPiece(id: string): Promise<number>;
  /** Record a profile view; returns the authoritative new view count. */
  recordProfileView(profileId: string, viewerKey: string): Promise<number>;

  // Inquiries (creator-scoped)
  listInquiries(creativeId?: string): Promise<PerformanceInquiry[]>;
  sendInquiry(inquiry: NewInquiry): Promise<PerformanceInquiry>;
  updateInquiryStatus(id: string, status: InquiryStatus, note?: string): Promise<string>;

  // Admin: cross-creator views
  listAllPieces(): Promise<CreativePiece[]>;

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

  getAdminStats(): Promise<AdminStats>;

  // Server-side paginated admin lists (range + exact count)
  listProfilesPage(options: PageOptions): Promise<Paged<CreativeProfile>>;
  listAllPiecesPage(options: PageOptions): Promise<Paged<CreativePiece>>;
  listCampaignsPage(options: PageOptions): Promise<Paged<Campaign>>;
  listSubmissionsPage(options: PageOptions): Promise<Paged<Submission>>;
  listFlagsPage(options: PageOptions): Promise<Paged<ContentFlag>>;
  listAuditLogPage(options: PageOptions): Promise<Paged<AuditLogEntry>>;
  listSystemLogPage(options: PageOptions): Promise<Paged<SystemLogEntry>>;
}
