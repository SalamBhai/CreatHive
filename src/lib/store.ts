'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreativeProfile,
  CreativePiece,
  PerformanceInquiry,
  CreativeDiscipline,
  InquiryStatus,
} from './types';
import { INITIAL_PROFILES, INITIAL_PIECES } from './sample-data';

const STORAGE_KEY_PROFILES = 'creathive_profiles_v1';
const STORAGE_KEY_PIECES = 'creathive_pieces_v1';
const STORAGE_KEY_INQUIRIES = 'creathive_inquiries_v1';

// Helper for initial hydration with fallback to localStorage
function getStoredProfiles(): Record<string, CreativeProfile> {
  if (typeof window === 'undefined') return INITIAL_PROFILES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILES);
    return raw ? JSON.parse(raw) : INITIAL_PROFILES;
  } catch {
    return INITIAL_PROFILES;
  }
}

function getStoredPieces(): CreativePiece[] {
  if (typeof window === 'undefined') return INITIAL_PIECES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PIECES);
    return raw ? JSON.parse(raw) : INITIAL_PIECES;
  } catch {
    return INITIAL_PIECES;
  }
}

function getStoredInquiries(): PerformanceInquiry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INQUIRIES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// TanStack Query Hooks
export function useCreativeProfile(username: string = 'sheriff') {
  return useQuery({
    queryKey: ['profile', username.toLowerCase()],
    queryFn: async (): Promise<CreativeProfile> => {
      const profiles = getStoredProfiles();
      const cleanUser = username.toLowerCase().replace('@', '');
      const profile = profiles[cleanUser] || profiles['sheriff'];
      return profile;
    },
  });
}

export function useAllProfiles() {
  return useQuery({
    queryKey: ['profiles-all'],
    queryFn: async (): Promise<CreativeProfile[]> => {
      const profiles = getStoredProfiles();
      return Object.values(profiles);
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      username,
      patch,
    }: {
      username: string;
      patch: Partial<CreativeProfile>;
    }): Promise<CreativeProfile> => {
      const profiles = getStoredProfiles();
      const clean = username.toLowerCase().replace('@', '');
      const existing = profiles[clean] || profiles['sheriff'];
      const updated: CreativeProfile = { ...existing, ...patch };
      const next = { ...profiles, [clean]: updated };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(next));
      }
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['profiles-all'] });
    },
  });
}

export function useInquiries() {
  return useQuery({
    queryKey: ['inquiries'],
    queryFn: async (): Promise<PerformanceInquiry[]> => getStoredInquiries(),
  });
}

export function useAllPieces() {
  return useQuery({
    queryKey: ['pieces-all'],
    queryFn: async (): Promise<CreativePiece[]> => getStoredPieces(),
  });
}

export function useCreativePieces(username: string = 'sheriff', filterDiscipline?: CreativeDiscipline | 'ALL') {
  const { data: profile } = useCreativeProfile(username);

  return useQuery({
    queryKey: ['pieces', profile?.id, filterDiscipline],
    enabled: !!profile?.id,
    queryFn: async (): Promise<CreativePiece[]> => {
      const pieces = getStoredPieces();
      const userPieces = pieces.filter((p) => p.creativeId === profile?.id);
      if (!filterDiscipline || filterDiscipline === 'ALL') {
        return userPieces;
      }
      return userPieces.filter((p) => p.discipline === filterDiscipline);
    },
  });
}

export function useApplaudPiece() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pieceId: string) => {
      const pieces = getStoredPieces();
      const updated = pieces.map((p) => {
        if (p.id === pieceId) {
          return { ...p, applauseCount: p.applauseCount + 1 };
        }
        return p;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_PIECES, JSON.stringify(updated));
      }
      return pieceId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pieces'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useAddPiece() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPiece: Omit<CreativePiece, 'id' | 'createdAt' | 'applauseCount'>) => {
      const pieces = getStoredPieces();
      const piece: CreativePiece = {
        ...newPiece,
        id: `piece-${Date.now()}`,
        applauseCount: 0,
        createdAt: new Date().toISOString(),
      };
      const updated = [piece, ...pieces];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_PIECES, JSON.stringify(updated));
      }
      return piece;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pieces'] });
    },
  });
}

export function useUpdatePiece() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<CreativePiece>;
    }): Promise<CreativePiece> => {
      const pieces = getStoredPieces();
      const updated = pieces.map((piece) =>
        piece.id === id ? { ...piece, ...patch } : piece
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_PIECES, JSON.stringify(updated));
      }
      return updated.find((piece) => piece.id === id)!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pieces'] });
    },
  });
}

export function useDeletePiece() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      const pieces = getStoredPieces().filter((piece) => piece.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_PIECES, JSON.stringify(pieces));
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pieces'] });
    },
  });
}

export function useUpdateInquiryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: InquiryStatus;
    }): Promise<string> => {
      const inquiries = getStoredInquiries().map((inquiry) =>
        inquiry.id === id ? { ...inquiry, status } : inquiry
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_INQUIRIES, JSON.stringify(inquiries));
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });
}

export function useSendInquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      inquiryData: Omit<PerformanceInquiry, 'id' | 'createdAt' | 'status'>
    ) => {
      const inquiries = getStoredInquiries();
      const inquiry: PerformanceInquiry = {
        ...inquiryData,
        id: `inq-${Date.now()}`,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      const updated = [inquiry, ...inquiries];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_INQUIRIES, JSON.stringify(updated));
      }
      return inquiry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });
}
