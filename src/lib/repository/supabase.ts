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

const toProfile = (r: ProfileRow): CreativeProfile => ({
  id: r.id,
  username: r.username,
  displayName: String(r.display_name ?? ''),
  tagline: String(r.tagline ?? ''),
  bio: String(r.bio ?? ''),
  avatarUrl: String(r.avatar_url ?? ''),
  bannerGradient: String(r.banner_gradient ?? 'from-amber-500/20 via-orange-500/20 to-red-500/20'),
  disciplines: (r.disciplines as CreativeDiscipline[]) || [],
  location: String(r.location ?? ''),
  cohortBadge: r.cohort_badge ? String(r.cohort_badge) : undefined,
  isAvailableForGigs: Boolean(r.is_available_for_gigs),
  socialLinks: (r.social_links as CreativeProfile['socialLinks']) || {},
  themeStyle: (r.theme_style as CreativeProfile['themeStyle']) || 'soft-brutal',
  stats: (r.stats as CreativeProfile['stats']) || { viewsCount: 0, applauseCount: 0, piecesCount: 0 },
  createdAt: String(r.created_at ?? ''),
});

const fromProfile = (p: CreativeProfile) => ({
  id: p.id,
  username: p.username,
  display_name: p.displayName,
  tagline: p.tagline,
  bio: p.bio,
  avatar_url: p.avatarUrl,
  banner_gradient: p.bannerGradient,
  disciplines: p.disciplines,
  location: p.location,
  cohort_badge: p.cohortBadge ?? null,
  is_available_for_gigs: p.isAvailableForGigs,
  social_links: p.socialLinks,
  theme_style: p.themeStyle,
  stats: p.stats,
  is_ypat_data: false,
});

const toPiece = (r: PieceRow): CreativePiece => ({
  id: r.id,
  creativeId: r.creative_id,
  title: String(r.title ?? ''),
  subtitle: r.subtitle ? String(r.subtitle) : undefined,
  discipline: r.discipline as CreativeDiscipline,
  mediaType: r.media_type as CreativePiece['mediaType'],
  mediaUrl: r.media_url ? String(r.media_url) : undefined,
  textContent: r.text_content ? String(r.text_content) : undefined,
  bodyHtml: r.body_html ? String(r.body_html) : undefined,
  pdfUrl: r.pdf_url ? String(r.pdf_url) : undefined,
  coverImageUrl: r.cover_image_url ? String(r.cover_image_url) : undefined,
  galleryImages: (r.gallery_images as string[]) || [],
  isFeatured: Boolean(r.is_featured),
  status: (r.status as CreativePiece['status']) || 'PUBLIC',
  sortOrder: Number(r.sort_order ?? 0),
  applauseCount: Number(r.applause_count ?? 0),
  duration: r.duration ? String(r.duration) : undefined,
  tags: (r.tags as string[]) || [],
  createdAt: r.created_at,
});

const fromPiece = (p: NewPiece | CreativePiece) => ({
  title: p.title,
  subtitle: p.subtitle ?? null,
  discipline: p.discipline,
  media_type: p.mediaType,
  media_url: p.mediaUrl ?? null,
  text_content: p.textContent ?? null,
  body_html: p.bodyHtml ?? null,
  pdf_url: p.pdfUrl ?? null,
  cover_image_url: p.coverImageUrl ?? null,
  gallery_images: p.galleryImages ?? [],
  is_featured: p.isFeatured ?? false,
  status: p.status ?? 'PUBLIC',
  sort_order: p.sortOrder ?? 0,
  tags: p.tags,
});

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

/** Seed/mock records remain visible until real YPAT users replace them. */
const mockProfiles = (): CreativeProfile[] =>
  Object.values(INITIAL_PROFILES).map((p) => ({ ...p, isYPATData: false, source: 'mock' as const }));

const mockPieces = (): CreativePiece[] =>
  INITIAL_PIECES.map((p) => ({ ...p, isYPATData: false, source: 'mock' as const }));

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
    const real = (data as ProfileRow[]).map(toProfile).map((p) => ({ ...p, isYPATData: true, source: 'live' as const }));
    const byHandle = new Map<string, CreativeProfile>();
    mockProfiles().forEach((p) => byHandle.set(p.username, p));
    real.forEach((p) => byHandle.set(p.username, p));
    return [...byHandle.values()];
  },

  async getProfile(username) {
    const clean = username.toLowerCase().replace('@', '');
    const { data, error } = await getDb().from('profiles').select('*').eq('username', clean).maybeSingle();
    if (error) throw error;
    if (data) return { ...toProfile(data as ProfileRow), isYPATData: true, source: 'live' as const };
    return mockProfiles().find((p) => p.username === clean);
  },

  async createProfile(profile) {
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
        location: patch.location,
        social_links: patch.socialLinks,
        is_available_for_gigs: patch.isAvailableForGigs,
      })
      .eq('username', clean)
      .select()
      .single();
    if (error) throw error;
    return toProfile(data as ProfileRow);
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

    // Apply the same filters to mock pieces, then merge (real wins on collisions).
    let mocks = mockPieces();
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

  async addPiece(piece) {
    const { data, error } = await getDb().from('pieces').insert(fromPiece(piece)).select().single();
    if (error) throw error;
    return toPiece(data as PieceRow);
  },

  async updatePiece(id, patch) {
    if (!isUuid(id)) return localRepository.updatePiece(id, patch);
    const { data, error } = await getDb()
      .from('pieces')
      .update(fromPiece(patch as NewPiece))
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
    await Promise.all(
      ids.map((id, index) => getDb().from('pieces').update({ sort_order: index }).eq('id', id))
    );
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
};
