import { Suspense } from 'react';
import { Metadata } from 'next';
import { PortfolioView } from '@/components/portfolio/PortfolioView';
import { INITIAL_PROFILES } from '@/lib/sample-data';
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
    createdAt: new Date().toISOString(),
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
  const { username } = await params;
  const clean = username.toLowerCase().replace('@', '');
  const profile = INITIAL_PROFILES[clean] || neutralProfile(clean);

  return {
    title: `${profile.displayName} (@${profile.username}) — CreatHive Portfolio`,
    description: `${profile.tagline}. ${profile.bio.slice(0, 150)}...`,
    openGraph: {
      title: `${profile.displayName} on CreatHive`,
      description: profile.tagline,
      images: [
        {
          url: profile.avatarUrl,
          width: 800,
          height: 800,
          alt: profile.displayName,
        },
      ],
    },
  };
}

async function PortfolioLoader({ params }: PageProps) {
  const { username } = await params;
  const clean = username.toLowerCase().replace('@', '');
  const initialProfile = INITIAL_PROFILES[clean] || neutralProfile(clean);
  const initialPieces = Object.values(
    (await import('@/lib/sample-data')).INITIAL_PIECES
  ).filter((piece) => piece.creativeId === initialProfile.id);
  return (
    <PortfolioView
      username={username}
      initialProfile={initialProfile}
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
