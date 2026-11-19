import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { serverSupabase } from '@/lib/supabase-server';

export const alt = 'Creative profile on CreatHive';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const sans = await readFile(join(process.cwd(), 'public/fonts/PlusJakartaSans-SemiBold.ttf'));
const serif = await readFile(join(process.cwd(), 'public/fonts/Newsreader-SemiBold.ttf'));

interface ShareProfile {
  display_name?: string;
  tagline?: string;
  avatar_url?: string;
}

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const clean = username.toLowerCase().replace('@', '');

  let profile: ShareProfile | null = null;
  if (serverSupabase) {
    const { data } = await serverSupabase
      .from('profiles')
      .select('display_name, tagline, avatar_url')
      .eq('username', clean)
      .maybeSingle();
    profile = data as ShareProfile | null;
  }

  const displayName = profile?.display_name || clean;
  const tagline = profile?.tagline || 'Creative on CreatHive';
  const avatarUrl = profile?.avatar_url || '';
  const LOGO_URL =
    process.env.EMAIL_LOGO_URL ||
    'https://res.cloudinary.com/qjedlk80/image/upload/v1795033044/creathive/brand/creathive-wordmark.png';

  // ImageResponse's internal <img> fetch has no timeout — fetch with a bound
  // ourselves and pass a data URI, falling back to initials / text on failure.
  let avatarData = '';
  if (/^https?:\/\//i.test(avatarUrl)) {
    try {
      const res = await fetch(avatarUrl, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const bytes = Buffer.from(await res.arrayBuffer());
        const type = res.headers.get('content-type') || 'image/jpeg';
        avatarData = `data:${type};base64,${bytes.toString('base64')}`;
      }
    } catch {
      // keep initials fallback
    }
  }

  let logoData = '';
  try {
    const res = await fetch(LOGO_URL, { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const bytes = Buffer.from(await res.arrayBuffer());
      const type = res.headers.get('content-type') || 'image/png';
      logoData = `data:${type};base64,${bytes.toString('base64')}`;
    }
  } catch {
    // keep text wordmark fallback
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#18181B',
          color: '#fff',
          fontFamily: 'sans',
          position: 'relative',
        }}
      >
        {/* soft decorative rings */}
        <div
          style={{
            position: 'absolute',
            top: -160,
            left: -120,
            width: 420,
            height: 420,
            borderRadius: 210,
            border: '2px solid #2A2A2E',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -180,
            right: -100,
            width: 460,
            height: 460,
            borderRadius: 230,
            border: '2px solid #2A2A2E',
            display: 'flex',
          }}
        />

        <div
          style={{
            width: 190,
            height: 190,
            borderRadius: 95,
            overflow: 'hidden',
            border: '4px solid #FFFFFF22',
            background: '#3F3F46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 52,
            color: '#fff',
          }}
        >
          {avatarData ? (
            <img src={avatarData} alt="" width={190} height={190} style={{ objectFit: 'cover' }} />
          ) : (
            initialsOf(displayName)
          )}
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 32,
            fontFamily: 'serif',
            fontSize: 64,
            fontWeight: 600,
            letterSpacing: -1.5,
            textAlign: 'center',
            lineHeight: 1.05,
          }}
        >
          {displayName}
        </div>
        <div style={{ display: 'flex', marginTop: 12, fontSize: 30, color: '#A8A29E' }}>
          <span>@{clean}</span>
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 20,
            fontSize: 30,
            color: '#FF5A36',
            textAlign: 'center',
            padding: '0 80px',
          }}
        >
          <span>{tagline}</span>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 76,
            background: '#14532D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 56px',
          }}
        >
          {logoData ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#FFFFFF',
                borderRadius: 12,
                padding: '8px 14px',
              }}
            >
              <img src={logoData} alt="" width={150} height={32} style={{ objectFit: 'contain' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 30 }}>
              <span>Creat</span>
              <span style={{ color: '#FF5A36' }}>Hive</span>
            </div>
          )}
          <div style={{ fontSize: 24, color: '#C7D5CC' }}>Built for the limitless creatives</div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: 'sans', data: sans }, { name: 'serif', data: serif }] }
  );
}
