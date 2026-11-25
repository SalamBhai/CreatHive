import type { DataRepository, NewInquiry, NewPiece, PageOptions, Paged } from './types';
import { disciplineInFilter, sortByRecency } from '@/lib/types';
import type {
  CreativeProfile,
  CreativePiece,
  PerformanceInquiry,
  InquiryStatus,
  Campaign,
  CampaignStatus,
  Submission,
  SubmissionStatus,
  ContentFlag,
  FlagStatus,
} from '@/lib/types';
import { INITIAL_PROFILES, INITIAL_PIECES } from '@/lib/sample-data';

const KEYS = {
  profiles: 'creathive_profiles_v1',
  pieces: 'creathive_pieces_v1',
  inquiries: 'creathive_inquiries_v1',
  campaigns: 'creathive_campaigns_v1',
  submissions: 'creathive_submissions_v1',
  flags: 'creathive_flags_v1',
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

const profiles = () => read<Record<string, CreativeProfile>>(KEYS.profiles, INITIAL_PROFILES);
const pieces = () => read<CreativePiece[]>(KEYS.pieces, INITIAL_PIECES);
const inquiries = () => read<PerformanceInquiry[]>(KEYS.inquiries, []);
const campaigns = () => read<Campaign[]>(KEYS.campaigns, []);
const submissions = () => read<Submission[]>(KEYS.submissions, []);
const flags = () => read<ContentFlag[]>(KEYS.flags, []);

/** Local mode has no server, but keeps the same paged contract. */
function paginate<T>(items: T[], options: PageOptions): Paged<T> {
  const start = options.page * options.pageSize;
  return { items: items.slice(start, start + options.pageSize), total: items.length };
}

export const localRepository: DataRepository = {
  async listProfiles() {
    return Object.values(profiles());
  },

  async getProfile(username) {
    const all = profiles();
    return all[username.toLowerCase().replace('@', '')] || all['sheriff'];
  },

  async createProfile(profile) {
    write(KEYS.profiles, { ...profiles(), [profile.username]: profile });
    return profile;
  },

  async updateProfile(username, patch) {
    const all = profiles();
    const clean = username.toLowerCase().replace('@', '');
    const updated: CreativeProfile = { ...(all[clean] || all['sheriff']), ...patch };
    write(KEYS.profiles, { ...all, [clean]: updated });
    return updated;
  },

  async setProfileAdmin(id, makeAdmin) {
    const all = profiles();
    const match = Object.entries(all).find(([, p]) => p.id === id);
    if (match) write(KEYS.profiles, { ...all, [match[0]]: { ...match[1], isAdmin: makeAdmin } });
  },

  async logAdminAction() {
    // Local/mock mode has no server audit log — no-op.
  },

  async listAuditLog() {
    return []; // local/mock mode has nothing to audit
  },

  async listPieces(options) {
    let result = pieces().filter((p) => !p.isDeleted);
    if (options?.creativeId) {
      result = result.filter((p) => p.creativeId === options.creativeId);
    }
    if (!options?.includeDrafts) {
      result = result.filter((p) => (p.status || 'PUBLIC') === 'PUBLIC');
    }
    if (options?.discipline) {
      result = result.filter((p) => disciplineInFilter(p.discipline, options.discipline));
    }
    // Studio keeps explicit manual order; every public feed uses recency.
    return options?.creativeId && options?.includeDrafts
      ? [...result].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      : sortByRecency(result);
  },

  async getPiece(id) {
    return pieces().find((p) => p.id === id && !p.isDeleted);
  },

  async addPiece(piece: NewPiece) {
    const created: CreativePiece = {
      ...piece,
      id: `piece-${Date.now()}`,
      applauseCount: 0,
      createdAt: new Date().toISOString(),
    };
    write(KEYS.pieces, [created, ...pieces()]);
    return created;
  },

  async updatePiece(id, patch) {
    const updated = pieces().map((p) => (p.id === id ? { ...p, ...patch } : p));
    write(KEYS.pieces, updated);
    return updated.find((p) => p.id === id)!;
  },

  async deletePiece(id) {
    // Soft delete — keep the row, mark it deleted.
    write(
      KEYS.pieces,
      pieces().map((p) =>
        p.id === id ? { ...p, isDeleted: true, deletedAt: new Date().toISOString() } : p
      )
    );
    return id;
  },

  async reorderPieces(ids) {
    write(
      KEYS.pieces,
      pieces().map((p) => {
        const index = ids.indexOf(p.id);
        return index >= 0 ? { ...p, sortOrder: index } : p;
      })
    );
    return ids;
  },

  async applaudPiece(id) {
    let newCount = 0;
    write(
      KEYS.pieces,
      pieces().map((p) => {
        if (p.id !== id) return p;
        newCount = p.applauseCount + 1;
        return { ...p, applauseCount: newCount };
      })
    );
    return newCount;
  },

  async recordProfileView(profileId) {
    // Local/mock mode has no server — return the existing count unchanged.
    const p = Object.values(profiles()).find((item) => item.id === profileId);
    return p?.stats?.viewsCount || 0;
  },

  async listInquiries(creativeId) {
    const all = inquiries();
    return creativeId ? all.filter((i) => i.creativeId === creativeId) : all;
  },

  async sendInquiry(inquiry: NewInquiry) {
    const created: PerformanceInquiry = {
      ...inquiry,
      id: `inq-${Date.now()}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    write(KEYS.inquiries, [created, ...inquiries()]);
    return created;
  },

  async updateInquiryStatus(id: string, status: InquiryStatus, note?: string) {
    const now = new Date().toISOString();
    write(
      KEYS.inquiries,
      inquiries().map((i) => {
        if (i.id !== id) return i;
        const reviewedAt = ['REVIEWED', 'RESPONDED', 'DECLINED'].includes(status)
          ? i.reviewedAt || now
          : i.reviewedAt;
        const respondedAt = ['RESPONDED', 'DECLINED'].includes(status)
          ? i.respondedAt || now
          : i.respondedAt;
        return { ...i, status, reviewedAt, respondedAt, replyNote: note ?? i.replyNote };
      })
    );
    return id;
  },

  async listAllPieces() {
    return pieces();
  },

  async listCampaigns() {
    return campaigns();
  },

  async createCampaign(campaign) {
    const created: Campaign = { ...campaign, id: `campaign-${Date.now()}`, createdAt: new Date().toISOString() };
    write(KEYS.campaigns, [created, ...campaigns()]);
    return created;
  },

  async updateCampaignStatus(id, status: CampaignStatus) {
    write(KEYS.campaigns, campaigns().map((c) => (c.id === id ? { ...c, status } : c)));
    return id;
  },

  async listSubmissions() {
    return submissions();
  },

  async createSubmission(submission) {
    const created: Submission = {
      ...submission,
      id: `sub-${Date.now()}`,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };
    write(KEYS.submissions, [created, ...submissions()]);
    return created;
  },

  async updateSubmissionStatus(id, status: SubmissionStatus) {
    write(KEYS.submissions, submissions().map((s) => (s.id === id ? { ...s, status, reviewedAt: new Date().toISOString() } : s)));
    return id;
  },

  async listFlags() {
    return flags();
  },

  async createFlag(flag) {
    const created: ContentFlag = { ...flag, id: `flag-${Date.now()}`, status: 'OPEN', createdAt: new Date().toISOString() };
    write(KEYS.flags, [created, ...flags()]);
    return created;
  },

  async updateFlagStatus(id, status: FlagStatus) {
    write(KEYS.flags, flags().map((f) => (f.id === id ? { ...f, status } : f)));
    return id;
  },

  async getAdminStats() {
    const allPieces = pieces();
    return {
      liveCreators: Object.values(profiles()).filter((p) => p.isYPATData).length,
      pieces: allPieces.length,
      openCampaigns: campaigns().filter((c) => c.status === 'OPEN').length,
      submissions: submissions().length,
      openFlags: flags().filter((f) => f.status === 'OPEN').length,
      applause: allPieces.reduce((sum, p) => sum + p.applauseCount, 0),
    };
  },

  async listProfilesPage(options) {
    return paginate(Object.values(profiles()), options);
  },
  async listAllPiecesPage(options) {
    return paginate(pieces(), options);
  },
  async listCampaignsPage(options) {
    return paginate(campaigns(), options);
  },
  async listSubmissionsPage(options) {
    return paginate(submissions(), options);
  },
  async listFlagsPage(options) {
    return paginate(flags(), options);
  },
  async listSystemLogPage(options) {
    return paginate([], options);
  },
  async listAuditLogPage() {
    return { items: [], total: 0 };
  },
};
