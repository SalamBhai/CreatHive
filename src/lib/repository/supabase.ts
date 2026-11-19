import { supabase } from '@/lib/supabase';
import { localRepository } from './local';
import { INITIAL_PROFILES, INITIAL_PIECES } from '@/lib/sample-data';
import type { DataRepository, NewInquiry, NewPiece, NewJoinRequest } from './types';
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

/** Fail only when a Supabase call is actually made, not at import time. */
function getDb() {
  if (!supabase) {
    throw new Error('Supabase client is not configured — check NEXT_PUBLIC_SUPABASE_* env vars.');
  }
  return supabase;
}

/* Row shapes (snake_case) → domain objects (camelCase). */
type ProfileRow = Record<string, unknown> & { id: string; username: string };
type PieceRow = Record<string, unknown> & { id: string; creative_id: string; created_at: string };
type InquiryRow = Record<string, unknown> & { id: string; creative_id: string; created_at: string };
type JoinRow = Record<string, unknown> & { id: string; created_at: string };
type CampaignRow = Record<string, unknown> & { id: string; created_at: string };
type SubmissionRow = Record<string, unknown> & { id: string; created_at: string };
type FlagRow = Record<string, unknown> & { id: string; created_at: string };

const toProfile = (r: ProfileRow): CreativeProfile => ({
  id: r.id,
  username: r.username,
  displayName: String(r.display_name ?? ''),
  tagline: String(r.tagline ?? ''),
  bio: String(r.bio ?? ''),
  avatarUrl: String(r.avatar_url ?? ''),
  avatarPublicId: r.avatar_public_id ? String(r.avatar_public_id) : undefined,
  bannerGradient: String(r.banner_gradient ?? 'from-amber-500/20 via-orange-500/20 to-red-500/20'),
  bannerUrl: r.banner_url ? String(r.banner_url) : undefined,
  bannerPublicId: r.banner_public_id ? String(r.banner_public_id) : undefined,
  disciplines: (r.disciplines as CreativeDiscipline[]) || [],
  location: String(r.location ?? ''),
  cohortBadge: r.cohort_badge ? String(r.cohort_badge) : undefined,
  isAvailableForGigs: Boolean(r.is_available_for_gigs),
  socialLinks: (r.social_links as CreativeProfile['socialLinks']) || {},
  themeStyle: (r.theme_style as CreativeProfile['themeStyle']) || 'soft-brutal',
  stats: (r.stats as CreativeProfile['stats']) || { viewsCount: 0, applauseCount: 0, piecesCount: 0 },
  // Anything in Supabase is real YPAT data by definition. Older rows were
  // inserted with a hardcoded false flag, so don't trust the stored value here.
  isYPATData: true,
  isAdmin: r.is_admin === true,
  source: 'live' as const,
  createdAt: String(r.created_at ?? ''),
});

const fromProfile = (p: CreativeProfile) => ({
  id: p.id,
  username: p.username,
  display_name: p.displayName,
  tagline: p.tagline,
  bio: p.bio,
  avatar_url: p.avatarUrl,
  avatar_public_id: p.avatarPublicId ?? null,
  banner_gradient: p.bannerGradient,
  banner_url: p.bannerUrl ?? null,
  banner_public_id: p.bannerPublicId ?? null,
  disciplines: p.disciplines,
  location: p.location,
  cohort_badge: p.cohortBadge ?? null,
  is_available_for_gigs: p.isAvailableForGigs,
  social_links: p.socialLinks,
  theme_style: p.themeStyle,
  stats: p.stats,
  is_ypat_data: p.isYPATData === true,
  source: p.source === 'mock' ? 'mock' : 'live',
});

const toPiece = (r: PieceRow): CreativePiece => ({
  id: r.id,
  creativeId: r.creative_id,
  title: String(r.title ?? ''),
  subtitle: r.subtitle ? String(r.subtitle) : undefined,
  discipline: r.discipline as CreativeDiscipline,
  mediaType: r.media_type as CreativePiece['mediaType'],
  mediaUrl: r.media_url ? String(r.media_url) : undefined,
  mediaPublicId: r.media_public_id ? String(r.media_public_id) : undefined,
  textContent: r.text_content ? String(r.text_content) : undefined,
  bodyHtml: r.body_html ? String(r.body_html) : undefined,
  pdfUrl: r.pdf_url ? String(r.pdf_url) : undefined,
  coverImageUrl: r.cover_image_url ? String(r.cover_image_url) : undefined,
  coverPublicId: r.cover_public_id ? String(r.cover_public_id) : undefined,
  galleryImages: (r.gallery_images as string[]) || [],
  galleryPublicIds: (r.gallery_public_ids as string[]) || [],
  isFeatured: Boolean(r.is_featured),
  status: (r.status as CreativePiece['status']) || 'PUBLIC',
  sortOrder: Number(r.sort_order ?? 0),
  applauseCount: Number(r.applause_count ?? 0),
  duration: r.duration ? String(r.duration) : undefined,
  tags: (r.tags as string[]) || [],
  createdAt: r.created_at,
});

const fromPiece = (p: NewPiece | CreativePiece) => ({
  creative_id: p.creativeId,
  title: p.title,
  subtitle: p.subtitle ?? null,
  discipline: p.discipline,
  media_type: p.mediaType,
  media_url: p.mediaUrl ?? null,
  media_public_id: p.mediaPublicId ?? null,
  text_content: p.textContent ?? null,
  body_html: p.bodyHtml ?? null,
  pdf_url: p.pdfUrl ?? null,
  cover_image_url: p.coverImageUrl ?? null,
  cover_public_id: p.coverPublicId ?? null,
  gallery_images: p.galleryImages ?? [],
  gallery_public_ids: p.galleryPublicIds ?? [],
  is_featured: p.isFeatured ?? false,
  status: p.status ?? 'PUBLIC',
  sort_order: p.sortOrder ?? 0,
  tags: p.tags,
});

/** Only send keys that are actually present — a partial patch (e.g. a
 * featured toggle) must not null out the rest of the piece. */
const fromPiecePatch = (p: Partial<CreativePiece>) => {
  const patch: Record<string, unknown> = {};
  if (p.title !== undefined) patch.title = p.title;
  if (p.subtitle !== undefined) patch.subtitle = p.subtitle ?? null;
  if (p.discipline !== undefined) patch.discipline = p.discipline;
  if (p.mediaType !== undefined) patch.media_type = p.mediaType;
  if (p.mediaUrl !== undefined) patch.media_url = p.mediaUrl ?? null;
  if (p.mediaPublicId !== undefined) patch.media_public_id = p.mediaPublicId ?? null;
  if (p.textContent !== undefined) patch.text_content = p.textContent ?? null;
  if (p.bodyHtml !== undefined) patch.body_html = p.bodyHtml ?? null;
  if (p.pdfUrl !== undefined) patch.pdf_url = p.pdfUrl ?? null;
  if (p.coverImageUrl !== undefined) patch.cover_image_url = p.coverImageUrl ?? null;
  if (p.coverPublicId !== undefined) patch.cover_public_id = p.coverPublicId ?? null;
  if (p.galleryImages !== undefined) patch.gallery_images = p.galleryImages ?? [];
  if (p.galleryPublicIds !== undefined) patch.gallery_public_ids = p.galleryPublicIds ?? [];
  if (p.isFeatured !== undefined) patch.is_featured = p.isFeatured;
  if (p.status !== undefined) patch.status = p.status;
  if (p.sortOrder !== undefined) patch.sort_order = p.sortOrder;
  if (p.tags !== undefined) patch.tags = p.tags;
  return patch;
};

const toInquiry = (r: InquiryRow): PerformanceInquiry => ({
  id: r.id,
  creativeId: r.creative_id,
  senderName: String(r.sender_name ?? ''),
  senderOrganization: r.sender_organization ? String(r.sender_organization) : undefined,
  senderEmail: String(r.sender_email ?? ''),
  senderPhone: r.sender_phone ? String(r.sender_phone) : undefined,
  eventType: r.event_type as PerformanceInquiry['eventType'],
  message: String(r.message ?? ''),
  status: r.status as InquiryStatus,
  createdAt: r.created_at,
});

const toJoin = (r: JoinRow): JoinRequest => ({
  id: r.id,
  handle: String(r.handle ?? ''),
  displayName: String(r.display_name ?? ''),
  email: String(r.email ?? ''),
  tagline: String(r.tagline ?? ''),
  status: r.status as JoinRequest['status'],
  createdAt: r.created_at,
});

const toCampaign = (r: CampaignRow): Campaign => ({
  id: r.id,
  title: String(r.title ?? ''),
  description: String(r.description ?? ''),
  discipline: (r.discipline as Campaign['discipline']) || 'ALL',
  reward: r.reward ? String(r.reward) : undefined,
  deadline: r.deadline ? String(r.deadline) : undefined,
  status: (r.status as CampaignStatus) || 'OPEN',
  createdBy: r.created_by ? String(r.created_by) : undefined,
  createdAt: r.created_at,
});

const toSubmission = (r: SubmissionRow): Submission => ({
  id: r.id,
  campaignId: String(r.campaign_id ?? ''),
  creativeId: String(r.creative_id ?? ''),
  pieceId: r.piece_id ? String(r.piece_id) : undefined,
  note: r.note ? String(r.note) : undefined,
  status: (r.status as SubmissionStatus) || 'OPEN',
  createdAt: r.created_at,
  reviewedAt: r.reviewed_at ? String(r.reviewed_at) : undefined,
});

const toFlag = (r: FlagRow): ContentFlag => ({
  id: r.id,
  targetType: (r.target_type as ContentFlag['targetType']) || 'piece',
  targetId: String(r.target_id ?? ''),
  reason: String(r.reason ?? ''),
  reporterId: r.reporter_id ? String(r.reporter_id) : undefined,
  status: (r.status as FlagStatus) || 'OPEN',
  createdAt: r.created_at,
});

/** Seed/mock records remain visible until real YPAT users replace them. */
const mockProfiles = (): CreativeProfile[] =>
  Object.values(INITIAL_PROFILES).map((p) => ({ ...p, isYPATData: false, source: 'mock' as const }));

const mockPieces = (): CreativePiece[] =>
  INITIAL_PIECES.map((p) => ({ ...p, isYPATData: false, source: 'mock' as const }));

/** Mock owner id (e.g. c-sheriff-01) → handle, for retiring mocks per creator. */
const MOCK_HANDLE_BY_OWNER_ID = new Map(
  Object.values(INITIAL_PROFILES).map((p) => [p.id, p.username] as const)
);

/** Mock ids like "c-sheriff-01" are not UUIDs — never send them to a uuid column. */
const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

/** Real records win on id/handle collisions with mocks. */
function mergeById<T extends { id: string }>(real: T[], mocks: T[]): T[] {
  const byId = new Map<string, T>();
  mocks.forEach((m) => byId.set(m.id, m));
  real.forEach((r) => byId.set(r.id, r));
  return [...byId.values()];
}

export const supabaseRepository: DataRepository = {
  async listProfiles() {
    const { data, error } = await getDb().from('profiles').select('*');
    if (error) throw error;
    const real = (data as ProfileRow[]).map(toProfile);
    const byHandle = new Map<string, CreativeProfile>();
    mockProfiles().forEach((p) => byHandle.set(p.username, p));
    real.forEach((p) => byHandle.set(p.username, p));
    return [...byHandle.values()];
  },

  async getProfile(username) {
    const clean = username.toLowerCase().replace('@', '');
    const { data, error } = await getDb().from('profiles').select('*').eq('username', clean).maybeSingle();
    if (error) throw error;
    if (data) return toProfile(data as ProfileRow);
    return mockProfiles().find((p) => p.username === clean);
  },

  async createProfile(profile) {
    // Mock/local ids like c-sheriff-01 are not UUIDs — never insert them into
    // the uuid primary key. Route them to localStorage instead.
    if (!isUuid(profile.id)) return localRepository.createProfile(profile);
    const { data, error } = await getDb().from('profiles').insert(fromProfile(profile)).select().single();
    if (error) throw error;
    return toProfile(data as ProfileRow);
  },

  async updateProfile(username, patch) {
    const clean = username.toLowerCase().replace('@', '');
    const existing = await supabaseRepository.getProfile(clean);
    if (existing && !isUuid(existing.id)) {
      return localRepository.updateProfile(clean, patch); // editing a mock profile
    }
    const { data, error } = await getDb()
      .from('profiles')
      .update({
        display_name: patch.displayName,
        tagline: patch.tagline,
        bio: patch.bio,
        avatar_url: patch.avatarUrl,
        avatar_public_id: patch.avatarPublicId,
        banner_url: patch.bannerUrl,
        banner_public_id: patch.bannerPublicId,
        location: patch.location,
        social_links: patch.socialLinks,
        is_available_for_gigs: patch.isAvailableForGigs,
        // is_admin is intentionally never written from the client — doing so
        // lets any user grant themselves admin. Use an RPC with a security
        // definer + is_admin() check for privileged changes.
      })
      .eq('id', existing!.id)
      .select()
      .single();
    if (error) throw error;
    return toProfile(data as ProfileRow);
  },

  async setProfileAdmin(id, makeAdmin) {
    const { error } = await getDb().rpc('set_profile_admin', { target_id: id, make_admin: makeAdmin });
    if (error) throw error;
  },

  async listPieces(options) {
    // A mock owner id (non-UUID) can only have mock pieces — skip the DB query.
    const skipDb = !!options?.creativeId && !isUuid(options.creativeId);
    let real: CreativePiece[] = [];
    if (!skipDb) {
      let query = getDb().from('pieces').select('*');
      if (options?.creativeId) query = query.eq('creative_id', options.creativeId);
      if (!options?.includeDrafts) query = query.eq('status', 'PUBLIC');
      if (options?.discipline && options.discipline !== 'ALL') {
        query = query.eq('discipline', options.discipline);
      }
      const { data, error } = await query;
      if (error) throw error;
      real = (data as PieceRow[]).map(toPiece).map((p) => ({ ...p, isYPATData: true, source: 'live' as const }));
    }

    // A creator with real work retires ALL of their mock pieces. Mocks for
    // other creators stay in the catalog until they publish real work too.
    let retiredHandles = new Set<string>();
    if (real.length) {
      const ownerIds = [...new Set(real.map((p) => p.creativeId))];
      const { data: owners, error: ownersError } = await getDb()
        .from('profiles')
        .select('id, username')
        .in('id', ownerIds);
      if (ownersError) throw ownersError;
      retiredHandles = new Set((owners || []).map((o) => String(o.username)));
    }

    // Apply the same filters to mock pieces, then merge (real wins on collisions).
    let mocks = mockPieces();
    mocks = mocks.filter((p) => {
      const handle = MOCK_HANDLE_BY_OWNER_ID.get(p.creativeId);
      return !handle || !retiredHandles.has(handle);
    });
    if (options?.creativeId) mocks = mocks.filter((p) => p.creativeId === options.creativeId);
    if (!options?.includeDrafts) mocks = mocks.filter((p) => (p.status || 'PUBLIC') === 'PUBLIC');
    if (options?.discipline && options.discipline !== 'ALL') {
      mocks = mocks.filter((p) => p.discipline === options.discipline);
    }

    return mergeById(real, mocks).sort((a, b) =>
      options?.creativeId
        ? (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
        : +new Date(b.createdAt) - +new Date(a.createdAt)
    );
  },

  async getPiece(id) {
    if (isUuid(id)) {
      const { data, error } = await getDb()
        .from('pieces')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        return { ...toPiece(data as PieceRow), isYPATData: true, source: 'live' as const };
      }
    }
    return mockPieces().find((p) => p.id === id);
  },

  async addPiece(piece) {
    // creative_id must equal auth.uid() for the insert RLS policy. Send the
    // signed-in user's id, not one from the form (a stale/mock id would 403).
    const { data: authData } = await getDb().auth.getUser();
    const ownerId = authData.user?.id || piece.creativeId;
    const { data, error } = await getDb()
      .from('pieces')
      .insert({ ...fromPiece(piece), creative_id: ownerId })
      .select()
      .single();
    if (error) throw error;
    return toPiece(data as PieceRow);
  },

  async updatePiece(id, patch) {
    if (!isUuid(id)) return localRepository.updatePiece(id, patch);
    const { data, error } = await getDb()
      .from('pieces')
      .update(fromPiecePatch(patch))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return toPiece(data as PieceRow);
  },

  async deletePiece(id) {
    if (!isUuid(id)) return localRepository.deletePiece(id);
    const { error } = await getDb().from('pieces').delete().eq('id', id);
    if (error) throw error;
    return id;
  },

  async reorderPieces(ids) {
    // Mock ids are not UUIDs — route them to localStorage instead of Postgres.
    const live = ids.map((id, index) => ({ id, index })).filter(({ id }) => isUuid(id));
    const local = ids.filter((id) => !isUuid(id));
    if (live.length) {
      await Promise.all(
        live.map(({ id, index }) =>
          getDb().from('pieces').update({ sort_order: index }).eq('id', id)
        )
      );
    }
    if (local.length) await localRepository.reorderPieces(local);
    return ids;
  },

  async applaudPiece(id) {
    // Mock pieces live in localStorage; bump locally through the local adapter.
    if (!isUuid(id)) return localRepository.applaudPiece(id);
    const { error } = await getDb().rpc('increment_applause', { piece_id: id });
    if (error) throw error;
    return id;
  },

  async listInquiries(creativeId) {
    if (creativeId && !isUuid(creativeId)) return []; // mock creator has no live inquiries
    let query = getDb().from('inquiries').select('*');
    if (creativeId) query = query.eq('creative_id', creativeId);
    const { data, error } = await query;
    if (error) throw error;
    return (data as InquiryRow[]).map(toInquiry);
  },

  async sendInquiry(inquiry: NewInquiry) {
    const { data, error } = await getDb()
      .from('inquiries')
      .insert({
        creative_id: inquiry.creativeId,
        sender_name: inquiry.senderName,
        sender_organization: inquiry.senderOrganization ?? null,
        sender_email: inquiry.senderEmail,
        sender_phone: inquiry.senderPhone ?? null,
        event_type: inquiry.eventType,
        message: inquiry.message,
      })
      .select()
      .single();
    if (error) throw error;
    return toInquiry(data as InquiryRow);
  },

  async updateInquiryStatus(id, status) {
    const { error } = await getDb().from('inquiries').update({ status }).eq('id', id);
    if (error) throw error;
    return id;
  },

  async listJoinRequests() {
    const { data, error } = await getDb().from('join_requests').select('*');
    if (error) throw error;
    return (data as JoinRow[]).map(toJoin);
  },

  async submitJoinRequest(request: NewJoinRequest) {
    const { data, error } = await getDb()
      .from('join_requests')
      .insert({
        handle: request.handle,
        display_name: request.displayName,
        email: request.email,
        tagline: request.tagline,
      })
      .select()
      .single();
    if (error) throw error;
    return toJoin(data as JoinRow);
  },

  async updateJoinRequestStatus(id, status) {
    const { error } = await getDb().from('join_requests').update({ status }).eq('id', id);
    if (error) throw error;
    return id;
  },

  async listAllPieces() {
    const { data, error } = await getDb().from('pieces').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data as PieceRow[]).map(toPiece).map((p) => ({ ...p, isYPATData: true, source: 'live' as const }));
  },

  async listAllInquiries() {
    const { data, error } = await getDb().from('inquiries').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data as InquiryRow[]).map(toInquiry);
  },

  async listCampaigns() {
    const { data, error } = await getDb().from('campaigns').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data as CampaignRow[]).map(toCampaign);
  },

  async createCampaign(campaign) {
    const { data, error } = await getDb()
      .from('campaigns')
      .insert({
        title: campaign.title,
        description: campaign.description,
        discipline: campaign.discipline,
        reward: campaign.reward ?? null,
        deadline: campaign.deadline ?? null,
        status: campaign.status,
      })
      .select()
      .single();
    if (error) throw error;
    return toCampaign(data as CampaignRow);
  },

  async updateCampaignStatus(id, status) {
    const { error } = await getDb().from('campaigns').update({ status }).eq('id', id);
    if (error) throw error;
    return id;
  },

  async listSubmissions() {
    const { data, error } = await getDb().from('submissions').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data as SubmissionRow[]).map(toSubmission);
  },

  async createSubmission(submission) {
    const { data, error } = await getDb()
      .from('submissions')
      .insert({
        campaign_id: submission.campaignId,
        creative_id: submission.creativeId,
        piece_id: submission.pieceId ?? null,
        note: submission.note ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return toSubmission(data as SubmissionRow);
  },

  async updateSubmissionStatus(id, status) {
    const { error } = await getDb()
      .from('submissions')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return id;
  },

  async listFlags() {
    const { data, error } = await getDb().from('flags').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data as FlagRow[]).map(toFlag);
  },

  async createFlag(flag) {
    const { data, error } = await getDb()
      .from('flags')
      .insert({
        target_type: flag.targetType,
        target_id: flag.targetId,
        reason: flag.reason,
      })
      .select()
      .single();
    if (error) throw error;
    return toFlag(data as FlagRow);
  },

  async updateFlagStatus(id, status) {
    const { error } = await getDb().from('flags').update({ status }).eq('id', id);
    if (error) throw error;
    return id;
  },
};
