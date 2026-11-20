import type { DataRepository, NewInquiry, NewPiece, NewJoinRequest } from './types';
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
import type { JoinRequest } from '@/lib/store-types';
import { INITIAL_PROFILES, INITIAL_PIECES } from '@/lib/sample-data';

const KEYS = {
  profiles: 'creathive_profiles_v1',
  pieces: 'creathive_pieces_v1',
  inquiries: 'creathive_inquiries_v1',
  joinRequests: 'creathive_join_requests_v1',
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
const joinRequests = () => read<JoinRequest[]>(KEYS.joinRequests, []);
const campaigns = () => read<Campaign[]>(KEYS.campaigns, []);
const submissions = () => read<Submission[]>(KEYS.submissions, []);
const flags = () => read<ContentFlag[]>(KEYS.flags, []);

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

  async listPieces(options) {
    let result = pieces();
    if (options?.creativeId) {
      result = result.filter((p) => p.creativeId === options.creativeId);
    }
    if (!options?.includeDrafts) {
      result = result.filter((p) => (p.status || 'PUBLIC') === 'PUBLIC');
    }
    if (options?.discipline && options.discipline !== 'ALL') {
      result = result.filter((p) => p.discipline === options.discipline);
    }
    return options?.creativeId
      ? result.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      : result.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  },

  async getPiece(id) {
    return pieces().find((p) => p.id === id);
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
    write(KEYS.pieces, pieces().filter((p) => p.id !== id));
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

  async updateInquiryStatus(id: string, status: InquiryStatus) {
    write(
      KEYS.inquiries,
      inquiries().map((i) => (i.id === id ? { ...i, status } : i))
    );
    return id;
  },

  async listJoinRequests() {
    return joinRequests();
  },

  async submitJoinRequest(request: NewJoinRequest) {
    const created: JoinRequest = {
      ...request,
      id: `join-${Date.now()}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    write(KEYS.joinRequests, [created, ...joinRequests()]);
    return created;
  },

  async updateJoinRequestStatus(id, status) {
    write(KEYS.joinRequests, joinRequests().map((r) => (r.id === id ? { ...r, status } : r)));
    return id;
  },

  async listAllPieces() {
    return pieces();
  },

  async listAllInquiries() {
    return inquiries();
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
};
