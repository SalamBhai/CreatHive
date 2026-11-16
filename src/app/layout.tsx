import type { Metadata, Viewport } from 'next';
import './globals.css';
import { QueryProvider } from '@/lib/query-provider';

export const metadata: Metadata = {
  title: 'CreatHive — Built for the limitless Creatives...',
  description:
    'A mobile-first PWA for creatives to showcase multi-discipline portfolios, capture performance opportunities, and manage work with unlimited access.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    title: 'CreatHive — Built for the limitless Creatives...',
    description: 'Empowering spoken word artists, dancers, poets, and visual tech creators.',
    type: 'website',
  },
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
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
