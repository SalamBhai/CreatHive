'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreativeProfile,
  CreativePiece,
  PerformanceInquiry,
  CreativeDiscipline,
  InquiryStatus,
  Campaign,
  CampaignStatus,
  Submission,
  SubmissionStatus,
  ContentFlag,
  FlagStatus,
} from './types';
import { disciplineInFilter } from './types';
import { repository } from './repository';
import { ADMIN_PAGE_SIZE, type PageOptions } from './repository/types';
import { useSession } from './auth';


/* ---------- Queries ---------- */

export function useCreativeProfile(
  username: string = 'sheriff',
  initialData?: CreativeProfile
) {
  return useQuery({
    queryKey: ['profile', username.toLowerCase()],
    // Server placeholder must be treated as stale so the real row is fetched
    // on mount — the query client's global staleTime would otherwise hide it.
    ...(initialData ? { initialData, initialDataUpdatedAt: 0 } : {}),
    queryFn: async (): Promise<CreativeProfile> => {
      const profile = await repository.getProfile(username);
      if (profile) return profile;
      // No row yet (fresh live DB): return a neutral placeholder, never undefined.
      return {
        id: '',
        username: username.toLowerCase().replace('@', ''),
        displayName: username,
        tagline: '',
        bio: '',
        avatarUrl: '',
        bannerGradient: 'from-amber-500/20 via-orange-500/20 to-red-500/20',
        disciplines: [],
        location: '',
        isAvailableForGigs: false,
        socialLinks: {},
        themeStyle: 'soft-brutal',
        stats: { viewsCount: 0, applauseCount: 0, piecesCount: 0 },
        createdAt: '1970-01-01T00:00:00.000Z',
      };
    },
  });
}

/** True once the signed-in user's profile is known to be an admin. */
export function useIsAdmin(): boolean {
  const session = useSession();
  const { data: profile } = useCreativeProfile(session?.username || '');
  return !!session && !!profile?.isAdmin;
}

export function useAllProfiles() {
  return useQuery({
    queryKey: ['profiles-all'],
    queryFn: () => repository.listProfiles(),
  });
}

/** Inquiries scoped to one creative — never admin/onboarding records. */
export function useInquiries(creativeId?: string) {
  return useQuery({
    queryKey: ['inquiries', creativeId],
    // Without an id both adapters return ALL inquiries — never run unscoped.
    enabled: !!creativeId,
    queryFn: () => repository.listInquiries(creativeId),
  });
}

/** A single piece by id — includes UNLISTED/DRAFT pieces for direct-link viewing. */
export function usePiece(id: string) {
  return useQuery({
    queryKey: ['piece', id],
    queryFn: () => repository.getPiece(id),
    enabled: !!id,
  });
}

/** Public feed: only published pieces, newest first. */
export function useAllPieces() {
  return useQuery({
    queryKey: ['pieces-all'],
    queryFn: () => repository.listPieces(),
  });
}

export function useCreativePieces(
  username: string = 'sheriff',
  filterDiscipline?: CreativeDiscipline | 'ALL',
  initialData?: CreativePiece[]
) {
  const { data: profile } = useCreativeProfile(username);
  const initial = initialData?.filter((p) =>
    disciplineInFilter(p.discipline, filterDiscipline)
  );

  return useQuery({
    queryKey: ['pieces', profile?.id, filterDiscipline],
    enabled: !!profile?.id,
    ...(initial?.length ? { initialData: initial, initialDataUpdatedAt: 0 } : {}),
    queryFn: () =>
      repository.listPieces({
        creativeId: profile!.id,
        discipline: filterDiscipline,
        includeDrafts: true,
      }),
  });
}

/* ---------- Admin ---------- */

export function useAdminPieces() {
  return useQuery({ queryKey: ['admin-pieces'], queryFn: () => repository.listAllPieces() });
}

export function useCampaigns() {
  return useQuery({ queryKey: ['campaigns'], queryFn: () => repository.listCampaigns() });
}

export function useSubmissions() {
  return useQuery({ queryKey: ['submissions'], queryFn: () => repository.listSubmissions() });
}

export function useFlags() {
  return useQuery({ queryKey: ['flags'], queryFn: () => repository.listFlags() });
}

export function useAuditLog() {
  return useQuery({ queryKey: ['audit-log'], queryFn: () => repository.listAuditLog() });
}

export function useAdminStats() {
  return useQuery({ queryKey: ['admin-stats'], queryFn: () => repository.getAdminStats() });
}

/* ---------- Admin: server-paged lists ---------- */

function useAdminPage<T>(
  key: string,
  page: number,
  fetcher: (options: PageOptions) => Promise<{ items: T[]; total: number }>,
  enabled = true
) {
  return useQuery({
    queryKey: [key, page, ADMIN_PAGE_SIZE],
    queryFn: () => fetcher({ page, pageSize: ADMIN_PAGE_SIZE }),
    enabled,
  });
}

export function useAdminProfilesPage(page: number, enabled = true) {
  return useAdminPage('admin-profiles-page', page, repository.listProfilesPage, enabled);
}
export function useAdminPiecesPage(page: number, enabled = true) {
  return useAdminPage('admin-pieces-page', page, repository.listAllPiecesPage, enabled);
}
export function useCampaignsPage(page: number, enabled = true) {
  return useAdminPage('admin-campaigns-page', page, repository.listCampaignsPage, enabled);
}
export function useSubmissionsPage(page: number, enabled = true) {
  return useAdminPage('admin-submissions-page', page, repository.listSubmissionsPage, enabled);
}
export function useFlagsPage(page: number, enabled = true) {
  return useAdminPage('admin-flags-page', page, repository.listFlagsPage, enabled);
}
export function useAuditLogPage(page: number, enabled = true) {
  return useAdminPage('admin-audit-page', page, repository.listAuditLogPage, enabled);
}

/* ---------- Mutations ---------- */

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: CreativeProfile) => repository.createProfile(profile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['profiles-all'] });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      username,
      patch,
    }: {
      username: string;
      patch: Partial<CreativeProfile>;
    }) => repository.updateProfile(username, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['profiles-all'] });
    },
  });
}

export function useSetProfileAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, makeAdmin }: { id: string; makeAdmin: boolean }) =>
      repository.setProfileAdmin(id, makeAdmin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles-all'] });
      invalidateAdminViews(queryClient);
    },
  });
}

export function useLogAdminAction() {
  return useMutation({
    mutationFn: (input: { action: string; target?: string; meta?: Record<string, unknown> }) =>
      repository.logAdminAction(input.action, input.target, input.meta),
  });
}

export function useReorderPieces() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => repository.reorderPieces(ids),
    onSuccess: () => invalidatePieces(queryClient),
  });
}

/** All piece views — editor, public feed, single post and admin — refresh together. */
function invalidatePieces(queryClient: ReturnType<typeof useQueryClient>) {
  ['pieces', 'pieces-all', 'piece', 'admin-pieces'].forEach((key) =>
    queryClient.invalidateQueries({ queryKey: [key] })
  );
}

/** Admin mutations must refresh both the aggregate counts and every paged list. */
function invalidateAdminViews(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    predicate: (query) => String(query.queryKey[0]).startsWith('admin-'),
  });
}

export function useApplaudPiece() {
  const queryClient = useQueryClient();
  const session = useSession();
  return useMutation({
    mutationFn: (pieceId: string) => {
      // Friendly client-side guard — never send a doomed request. The RPC
      // still checks auth.uid() as defense in depth.
      if (!session) return Promise.reject(new Error('Sign in to applaud'));
      return repository.applaudPiece(pieceId);
    },
    onSuccess: (newCount, pieceId) => {
      // The RPC returns the authoritative count — write it straight into every
      // cached view so the number updates instantly and consistently.
      const patch = (old: unknown): unknown => {
        if (Array.isArray(old)) {
          return old.map((p) =>
            p && typeof p === 'object' && 'id' in p && p.id === pieceId
              ? { ...(p as CreativePiece), applauseCount: newCount }
              : p
          );
        }
        if (old && typeof old === 'object' && 'id' in old && (old as CreativePiece).id === pieceId) {
          return { ...(old as CreativePiece), applauseCount: newCount };
        }
        return old;
      };
      queryClient.setQueriesData({ queryKey: ['pieces-all'] }, patch);
      queryClient.setQueriesData({ queryKey: ['admin-pieces'] }, patch);
      queryClient.setQueriesData({ queryKey: ['piece', pieceId] }, patch);
      queryClient.setQueriesData({ queryKey: ['pieces'] }, patch);
      invalidatePieces(queryClient);
    },
  });
}

export function useRecordProfileView() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, viewerKey }: { profileId: string; viewerKey: string }) =>
      repository.recordProfileView(profileId, viewerKey),
    onSuccess: (newCount, { profileId }) => {
      // Patch viewsCount into every cached profile object for this id.
      queryClient.setQueriesData({ queryKey: ['profile'] }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('id' in old) || old.id !== profileId) return old;
        const p = old as CreativeProfile;
        return { ...p, stats: { ...p.stats, viewsCount: newCount } };
      });
      queryClient.setQueriesData({ queryKey: ['profiles-all'] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((p) =>
          p && typeof p === 'object' && 'id' in p && p.id === profileId
            ? { ...(p as CreativeProfile), stats: { ...(p as CreativeProfile).stats, viewsCount: newCount } }
            : p
        );
      });
    },
  });
}

export function useAddPiece() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (piece: Omit<CreativePiece, 'id' | 'createdAt' | 'applauseCount'>) =>
      repository.addPiece(piece),
    onSuccess: () => invalidatePieces(queryClient),
  });
}

export function useUpdatePiece() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CreativePiece> }) =>
      repository.updatePiece(id, patch),
    onSuccess: () => invalidatePieces(queryClient),
  });
}

export function useDeletePiece() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repository.deletePiece(id),
    onSuccess: () => {
      invalidatePieces(queryClient);
      invalidateAdminViews(queryClient);
    },
  });
}

export function useUpdateInquiryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: InquiryStatus; note?: string }) =>
      repository.updateInquiryStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      invalidateAdminViews(queryClient);
    },
  });
}

export function useSendInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inquiry: Omit<PerformanceInquiry, 'id' | 'createdAt' | 'status'>) =>
      repository.sendInquiry(inquiry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      invalidateAdminViews(queryClient);
    },
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (campaign: Omit<Campaign, 'id' | 'createdAt'>) => repository.createCampaign(campaign),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      invalidateAdminViews(qc);
    },
  });
}

export function useUpdateCampaignStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CampaignStatus }) =>
      repository.updateCampaignStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      invalidateAdminViews(qc);
    },
  });
}

export function useCreateSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (submission: Omit<Submission, 'id' | 'createdAt' | 'status'>) =>
      repository.createSubmission(submission),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['submissions'] }),
  });
}

export function useUpdateSubmissionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SubmissionStatus }) =>
      repository.updateSubmissionStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['submissions'] });
      invalidateAdminViews(qc);
    },
  });
}

export function useCreateFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (flag: Omit<ContentFlag, 'id' | 'createdAt' | 'status'>) => repository.createFlag(flag),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flags'] });
      invalidateAdminViews(qc);
    },
  });
}

export function useUpdateFlagStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: FlagStatus }) => repository.updateFlagStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flags'] });
      invalidateAdminViews(qc);
    },
  });
}
