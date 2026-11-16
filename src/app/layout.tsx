import type { Metadata, Viewport } from 'next';
import './globals.css';
import { QueryProvider } from '@/lib/query-provider';

export const metadata: Metadata = {
  title: 'CreatHive — Built for the limitless Creatives...',
  applicationName: 'CreatHive (pronounced “Creative”)',
  keywords: [
    'CreatHive',
    'Creative',
    'creative hive',
    'creative portfolio',
    'spoken word',
    'poetry',
    'dance',
    'UI/UX',
    'YPAT 2026',
  ],
  description:
    'CreatHive — pronounced “Creative” — is a mobile-first PWA for creatives to showcase multi-discipline portfolios, capture performance opportunities, and manage work with unlimited access.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    title: 'CreatHive — Built for the limitless Creatives...',
    description:
      'CreatHive (pronounced “Creative”) — a stage for spoken word artists, dancers, poets, and visual tech creators.',
    type: 'website',
  },
};

// Tells search engines and assistants how the neologism is meant to be spoken.
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'CreatHive',
  alternateName: ['Creative', 'Creative Hive'],
  description: 'CreatHive, pronounced “Creative”, is a stage built for the limitless creatives.',
  url: 'https://creathive.app',
};

export const viewport: Viewport = {
  themeColor: '#FF5A36',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#FDFBF7] text-[#18181B]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
