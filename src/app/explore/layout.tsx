import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return {
    title: 'Explore Arts | CreatHive',
    description:
      'Discover work from the YPAT 2026 to 2027 cohort: spoken word, poetry, dance, music, tech imagery and UI/UX. Filter by niche.',
    openGraph: {
      title: 'Explore Arts | CreatHive',
      description: 'Built for the limitless creatives. Discover work by niche.',
      type: 'website',
    },
  };
}

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
