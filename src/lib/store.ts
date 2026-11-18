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
import type { JoinRequest } from './store-types';
import { repository } from './repository';

export type { JoinRequest } from './store-types';

/* ---------- Queries ---------- */

export function useCreativeProfile(
  username: string = 'sheriff',
  initialData?: CreativeProfile
) {
  return useQuery({
    queryKey: ['profile', username.toLowerCase()],
    ...(initialData ? { initialData } : {}),
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
        createdAt: new Date().toISOString(),
      };
    },
  });
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
    queryFn: () => repository.listInquiries(creativeId),
  });
}

/** Join requests are an admin concern — kept in their own store. */
export function useJoinRequests() {
  return useQuery({
    queryKey: ['join-requests'],
    queryFn: () => repository.listJoinRequests(),
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
  const initial = initialData?.filter(
    (p) => !filterDiscipline || filterDiscipline === 'ALL' || p.discipline === filterDiscipline
  );

  return useQuery({
    queryKey: ['pieces', profile?.id, filterDiscipline],
    enabled: !!profile?.id,
    ...(initial?.length ? { initialData: initial } : {}),
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

export function useAdminInquiries() {
  return useQuery({ queryKey: ['admin-inquiries'], queryFn: () => repository.listAllInquiries() });
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

export function useReorderPieces() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => repository.reorderPieces(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pieces'] }),
  });
}

export function useApplaudPiece() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pieceId: string) => repository.applaudPiece(pieceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pieces'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useAddPiece() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (piece: Omit<CreativePiece, 'id' | 'createdAt' | 'applauseCount'>) =>
      repository.addPiece(piece),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pieces'] }),
  });
}

export function useUpdatePiece() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CreativePiece> }) =>
      repository.updatePiece(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pieces'] }),
  });
}

export function useDeletePiece() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repository.deletePiece(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pieces'] }),
  });
}

export function useUpdateInquiryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: InquiryStatus }) =>
      repository.updateInquiryStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inquiries'] }),
  });
}

export function useSendInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inquiry: Omit<PerformanceInquiry, 'id' | 'createdAt' | 'status'>) =>
      repository.sendInquiry(inquiry),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inquiries'] }),
  });
}

export function useSubmitJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: Omit<JoinRequest, 'id' | 'status' | 'createdAt'>) =>
      repository.submitJoinRequest(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['join-requests'] }),
  });
}

export function useUpdateJoinRequestStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'PENDING' | 'APPROVED' }) =>
      repository.updateJoinRequestStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['join-requests'] }),
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (campaign: Omit<Campaign, 'id' | 'createdAt'>) => repository.createCampaign(campaign),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

export function useUpdateCampaignStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CampaignStatus }) =>
      repository.updateCampaignStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['submissions'] }),
  });
}

export function useCreateFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (flag: Omit<ContentFlag, 'id' | 'createdAt' | 'status'>) => repository.createFlag(flag),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flags'] }),
  });
}

export function useUpdateFlagStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: FlagStatus }) => repository.updateFlagStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flags'] }),
  });
}
