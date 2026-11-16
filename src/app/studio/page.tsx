'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  ArrowLeft,
  Eye,
  Trash,
  CheckCircle,
  MicrophoneStage,
  Feather,
  DeviceMobile,
  Cube,
  Sparkle,
  EnvelopeSimple,
  SlidersHorizontal,
} from '@phosphor-icons/react';
import { CreatHiveWordmark } from '@/components/brand/CreatHiveWordmark';
import { NeoButton } from '@/components/ui/NeoButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useCreativeProfile, useCreativePieces, useAddPiece } from '@/lib/store';
import { CreativeDiscipline, MediaType } from '@/lib/types';
import { DISCIPLINE_CONFIG } from '@/components/ui/DisciplineChip';

export default function StudioPage() {
  const currentUsername = 'sheriff';
  const { data: profile } = useCreativeProfile(currentUsername);
  const { data: pieces } = useCreativePieces(currentUsername);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [discipline, setDiscipline] = useState<CreativeDiscipline>('UIUX_DESIGN');
  const [mediaType, setMediaType] = useState<MediaType>('IMAGE_GALLERY');
  const [mediaUrl, setMediaUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [contextNote, setContextNote] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const addPieceMutation = useAddPiece();

  const handleAddPiece = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !profile) return;

    addPieceMutation.mutate(
      {
        creativeId: profile.id,
        title,
        subtitle,
        discipline,
        mediaType,
        mediaUrl: mediaUrl || undefined,
        textContent: textContent || undefined,
        coverImageUrl:
          coverImageUrl ||
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        contextNote,
        tags: tagsInput ? tagsInput.split(',').map((t) => t.trim()) : ['Creative', discipline],
      },
      {
        onSuccess: () => {
          setIsAddModalOpen(false);
          // Reset
          setTitle('');
          setSubtitle('');
          setMediaUrl('');
          setTextContent('');
          setCoverImageUrl('');
          setContextNote('');
          setTagsInput('');
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b-2 border-[#18181B] px-4 py-3 neo-shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/${currentUsername}`}
              className="p-1.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-[#18181B]"
              title="Back to Portfolio"
            >
              <ArrowLeft size={18} weight="bold" />
            </Link>
            <CreatHiveWordmark size="sm" />
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/${currentUsername}`} target="_blank">
              <NeoButton
                variant="secondary"
                size="sm"
                icon={<Eye size={15} weight="bold" />}
              >
                View Public Link
              </NeoButton>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-white border-2 border-[#18181B] rounded-2xl p-5 neo-shadow space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF5A36] bg-[#FFF2EE] px-2.5 py-1 rounded-full border border-[#FF5A36]/30">
              Creator Studio • Unlimited Management
            </span>
            <span className="text-xs font-mono font-bold text-stone-500">
              @{profile?.username}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold font-sans-ui text-[#18181B]">
            Welcome back, {profile?.displayName}
          </h1>

          <p className="text-xs md:text-sm text-stone-600 font-sans-ui">
            Manage your creative pieces, update performance links, and monitor your portfolio conversions.
          </p>

          <div className="pt-3 flex gap-2">
            <NeoButton
              variant="primary"
              size="md"
              onClick={() => setIsAddModalOpen(true)}
              icon={<Plus size={18} weight="bold" />}
            >
              Add New Piece
            </NeoButton>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border-2 border-[#18181B] rounded-2xl p-4 neo-shadow text-center">
            <div className="text-2xl font-black text-[#18181B]">
              {profile?.stats.piecesCount || pieces?.length || 0}
            </div>
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wide mt-1">
              Pieces
            </div>
          </div>

          <div className="bg-white border-2 border-[#18181B] rounded-2xl p-4 neo-shadow text-center">
            <div className="text-2xl font-black text-[#FF5A36]">
              {profile?.stats.applauseCount || 0}
            </div>
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wide mt-1">
              Applauses
            </div>
          </div>

          <div className="bg-white border-2 border-[#18181B] rounded-2xl p-4 neo-shadow text-center">
            <div className="text-2xl font-black text-[#FFAE19]">
              {profile?.stats.viewsCount || 0}
            </div>
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wide mt-1">
              Views
            </div>
          </div>
        </div>

        {/* Pieces List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-sans-ui text-[#18181B]">
              Your Published Work ({pieces?.length || 0})
            </h2>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs font-bold text-[#FF5A36] hover:underline"
            >
              + Quick Add
            </button>
          </div>

          <div className="space-y-3">
            {pieces?.map((piece) => {
              const config = DISCIPLINE_CONFIG[piece.discipline] || DISCIPLINE_CONFIG.OTHER;
              const IconComp = config.icon;

              return (
                <div
                  key={piece.id}
                  className="bg-white border-2 border-[#18181B] rounded-xl p-3.5 neo-shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg border border-[#18181B] flex items-center justify-center shrink-0"
                      style={{ backgroundColor: config.bg, color: config.color }}
                    >
                      <IconComp size={20} weight="duotone" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#18181B] truncate">
                        {piece.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 font-medium truncate">
                        {config.label} • {piece.applauseCount} applauses
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/${currentUsername}`}
                      className="p-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700"
                      title="View"
                    >
                      <Eye size={16} weight="bold" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Add New Piece Modal */}
      <BottomSheet
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Publish New Creative Work"
        subtitle="Add a spoken word piece, poem, dance reel, or UI tech imagery."
      >
        <form onSubmit={handleAddPiece} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-[#18181B] mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Echoes of the Sahel / Mobile Interface Prototype"
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#18181B] bg-white text-xs font-sans-ui outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#18181B] mb-1">
              Subtitle / Hook
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="A brief one-line description of the piece"
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#18181B] bg-white text-xs font-sans-ui outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#18181B] mb-1">
                Discipline *
              </label>
              <select
                value={discipline}
                onChange={(e) => {
                  const val = e.target.value as CreativeDiscipline;
                  setDiscipline(val);
                  if (val === 'SPOKEN_WORD' || val === 'MUSIC') setMediaType('AUDIO');
                  else if (val === 'DANCE' || val === 'MOTION_ANIMATION') setMediaType('VIDEO');
                  else if (val === 'POETRY') setMediaType('TEXT');
                  else setMediaType('IMAGE_GALLERY');
                }}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-[#18181B] bg-white text-xs font-sans-ui outline-none"
              >
                <option value="SPOKEN_WORD">Spoken Word</option>
                <option value="POETRY">Poetry & Verse</option>
                <option value="UIUX_DESIGN">UI/UX Mobile Design</option>
                <option value="TECH_IMAGERY">Tech Imagery & 3D</option>
                <option value="DANCE">Dance & Performance</option>
                <option value="MOTION_ANIMATION">Motion Graphics</option>
                <option value="MUSIC">Music & Vocals</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#18181B] mb-1">
                Media Format *
              </label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as MediaType)}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-[#18181B] bg-white text-xs font-sans-ui outline-none"
              >
                <option value="IMAGE_GALLERY">Image Gallery / UI Mockups</option>
                <option value="AUDIO">Audio Stream (Spoken Word/Song)</option>
                <option value="VIDEO">Video Reel / Performance Clip</option>
                <option value="TEXT">Text Reader (Poetry / Verse)</option>
              </select>
            </div>
          </div>

          {/* Conditional Media URL inputs */}
          {(mediaType === 'AUDIO' || mediaType === 'VIDEO') && (
            <div>
              <label className="block text-xs font-bold text-[#18181B] mb-1">
                {mediaType === 'AUDIO' ? 'Audio Stream URL (.mp3 / cloud link)' : 'Video URL (.mp4 / cloud stream)'}
              </label>
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#18181B] bg-white text-xs font-sans-ui outline-none"
              />
            </div>
          )}

          {/* Conditional text editor for Poetry / Spoken word lyrics */}
          {(mediaType === 'TEXT' || mediaType === 'AUDIO') && (
            <div>
              <label className="block text-xs font-bold text-[#18181B] mb-1">
                {mediaType === 'TEXT' ? 'Full Poem / Writing *' : 'Spoken Word Script / Lyrics (Optional)'}
              </label>
              <textarea
                rows={5}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Write or paste your poem or spoken word lines here..."
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#18181B] bg-white text-xs font-editorial text-base italic outline-none resize-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#18181B] mb-1">
              Context Note / Performance Tag
            </label>
            <input
              type="text"
              value={contextNote}
              onChange={(e) => setContextNote(e.target.value)}
              placeholder="e.g. YPAT Creative Showcase 2026"
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#18181B] bg-white text-xs font-sans-ui outline-none"
            />
          </div>

          <div className="pt-2">
            <NeoButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
            >
              Publish to Portfolio
            </NeoButton>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
