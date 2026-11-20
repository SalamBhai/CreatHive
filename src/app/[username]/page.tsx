import { Suspense } from 'react';
import { Metadata } from 'next';
import { PortfolioView } from '@/components/portfolio/PortfolioView';
import { INITIAL_PROFILES } from '@/lib/sample-data';
import { serverSupabase } from '@/lib/supabase-server';
import type { CreativeProfile } from '@/lib/types';

/** Unknown handles must not inherit the mock `sheriff` record. */
function neutralProfile(username: string): CreativeProfile {
  const clean = username.toLowerCase().replace('@', '');
  return {
    id: '',
    username: clean,
    displayName: clean,
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
}

interface PageProps {
  params: Promise<{ username: string }>;
}

export function generateStaticParams() {
  return Object.keys(INITIAL_PROFILES).map((username) => ({
    username,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  'use cache';
  const { username } = await params;
  const clean = username.toLowerCase().replace('@', '');
  let profile: CreativeProfile = INITIAL_PROFILES[clean] || neutralProfile(clean);
  if (serverSupabase) {
    const { data } = await serverSupabase
      .from('profiles')
      .select('display_name, tagline, bio, avatar_url')
      .eq('username', clean)
      .maybeSingle();
    if (data) {
      profile = {
        ...profile,
        displayName: String(data.display_name || clean),
        username: clean,
        tagline: String(data.tagline || ''),
        bio: String(data.bio || ''),
        avatarUrl: String(data.avatar_url || ''),
      };
    }
  }

  return {
    title: `${profile.displayName} (@${profile.username}) — CreatHive Portfolio`,
    description: `${profile.tagline}. ${profile.bio.slice(0, 150)}...`,
    // og:image comes from the dynamic opengraph-image.tsx share card
    openGraph: {
      title: `${profile.displayName} on CreatHive`,
      description: profile.tagline,
    },
  };
}

async function PortfolioLoader({ params }: PageProps) {
  const { username } = await params;
  const clean = username.toLowerCase().replace('@', '');
  // Only seed known mock handles. For a real username an empty placeholder
  // would flash on first paint before the real row loads — let the loader show.
  const mockProfile = INITIAL_PROFILES[clean];
  const initialPieces = mockProfile
    ? Object.values((await import('@/lib/sample-data')).INITIAL_PIECES).filter(
        (piece) => piece.creativeId === mockProfile.id
      )
    : undefined;
  return (
    <PortfolioView
      username={username}
      initialProfile={mockProfile}
      initialPieces={initialPieces}
    />
  );
}

export default function CreativePage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
          <div className="w-8 h-8 border-3 border-[#FF5A36] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PortfolioLoader {...props} />
    </Suspense>
  );
}
