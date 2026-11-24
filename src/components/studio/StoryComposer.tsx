'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Plus,
  TextT,
  Quotes,
  Image as ImageIcon,
  CaretRight,
  CaretDown,
  PlayCircle,
  Code,
  Minus,
  TextB,
  TextItalic,
  LinkSimple,
  ListBullets,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  X,
} from '@phosphor-icons/react';
import { toEmbedUrl } from '@/lib/media';
import { uploadFile } from '@/lib/upload';

interface StoryComposerProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

type InsertKind = 'text' | 'heading' | 'quote' | 'image' | 'grid' | 'video' | 'embed' | 'divider';
type DialogKind = 'link' | 'video' | 'embed';

const INSERT_OPTIONS: Array<{ kind: InsertKind; label: string; icon: React.ElementType }> = [
  { kind: 'text', label: 'Text', icon: TextT },
  { kind: 'heading', label: 'Heading', icon: TextT },
  { kind: 'quote', label: 'Quote', icon: Quotes },
  { kind: 'image', label: 'Image', icon: ImageIcon },
  { kind: 'grid', label: 'Photo grid', icon: CaretRight },
  { kind: 'video', label: 'Video / Audio', icon: PlayCircle },
  { kind: 'embed', label: 'Embed', icon: Code },
  { kind: 'divider', label: 'Divider', icon: Minus },
];

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const inputClass =
  'w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#FF5A36]';

export function StoryComposer({ value, onChange, placeholder = 'Tell your story…' }: StoryComposerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [form, setForm] = useState({ url: '', caption: '', poster: '' });
  const [pendingUpload, setPendingUpload] = useState<'image' | 'grid' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.innerHTML !== value) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const rememberSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && ref.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const exec = (command: string, arg?: string) => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
    document.execCommand(command, false, arg);
    onChange(el.innerHTML);
    rememberSelection();
  };

  const closeDialog = () => {
    setDialog(null);
    setForm({ url: '', caption: '', poster: '' });
    setPendingUpload(null);
    setError('');
  };

  const openDialog = (kind: DialogKind) => {
    rememberSelection();
    setMenuOpen(false);
    setError('');
    setForm({ url: '', caption: '', poster: '' });
    setPendingUpload(null);
    setDialog(kind);
  };

  /** Images/grids go straight to the OS file picker — no intermediate form. */
  const pickFiles = (kind: 'image' | 'grid') => {
    rememberSelection();
    setMenuOpen(false);
    setPendingUpload(kind);
    setError('');
    fileInput.current?.click();
  };

  const insert = (kind: InsertKind) => {
    setMenuOpen(false);
    if (kind === 'text') return exec('insertHTML', '<p>Write your text here.</p>');
    if (kind === 'heading') return exec('insertHTML', '<h2>A section heading</h2>');
    if (kind === 'quote') return exec('insertHTML', '<blockquote>A thought worth keeping.</blockquote>');
    if (kind === 'divider') return exec('insertHTML', '<hr />');
    if (kind === 'image' || kind === 'grid') return pickFiles(kind);
    openDialog(kind as DialogKind);
  };

  const apply = () => {
    if (!dialog) return;
    const url = form.url.trim();

    if (dialog === 'link') {
      if (!url) return setError('Enter a link URL.');
      exec('createLink', url);
      return closeDialog();
    }
    if (dialog === 'video') {
      if (!url) return setError('Add a video or audio URL.');
      const embed = toEmbedUrl(url);
      if (embed) {
        exec('insertHTML', `<figure><div class="video-frame"><iframe src="${embed}" allowfullscreen></iframe></div></figure>`);
      } else {
        const poster = form.poster.trim();
        exec(
          'insertHTML',
          `<figure><video controls ${poster ? `poster="${escapeHtml(poster)}"` : ''} src="${escapeHtml(url)}"></video></figure>`
        );
      }
      return closeDialog();
    }
    if (dialog === 'embed') {
      const embed = toEmbedUrl(url);
      if (!embed) return setError('Only YouTube and Vimeo links can be embedded.');
      exec('insertHTML', `<figure><div class="video-frame"><iframe src="${embed}" allowfullscreen></iframe></div></figure>`);
      return closeDialog();
    }
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length || !dialog) return;
    setBusy(true);
    setError('');
    try {
      const results = await Promise.all(Array.from(files).map((file) => uploadFile(file, 'gallery')));
      const urls = results.map((r) => r.url);
      if (pendingUpload === 'grid') {
        exec(
          'insertHTML',
          `<div class="photo-grid" data-story-image="true">${urls
            .map((u) => `<img src="${escapeHtml(u)}" alt="" />`)
            .join('')}</div>`
        );
      } else {
        // An editable caption placeholder — the creator types straight into
        // the figure; no extra panel or prompt needed.
        exec(
          'insertHTML',
          `<figure data-story-image="true"><img src="${escapeHtml(urls[0])}" alt="" /><figcaption>Type a caption…</figcaption></figure>`
        );
      }
      setPendingUpload(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const dialogCopy: Record<DialogKind, { title: string; hint: string }> = {
    link: { title: 'Add a link', hint: 'Paste the URL you want this text to point to.' },
    video: { title: 'Insert video or audio', hint: 'Paste a direct media URL or a YouTube/Vimeo link. Poster is optional.' },
    embed: { title: 'Insert an embed', hint: 'Paste a YouTube or Vimeo share URL.' },
  };

  return (
    <div className="relative rounded-2xl border border-stone-200 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-stone-200 px-3 py-2">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')} title="Bold" className="rounded p-1.5 text-stone-600 hover:bg-stone-100">
          <TextB size={16} weight="bold" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')} title="Italic" className="rounded p-1.5 text-stone-600 hover:bg-stone-100">
          <TextItalic size={16} weight="bold" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => openDialog('link')}
          title="Link"
          className="rounded p-1.5 text-stone-600 hover:bg-stone-100"
        >
          <LinkSimple size={16} weight="bold" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')} title="List" className="rounded p-1.5 text-stone-600 hover:bg-stone-100">
          <ListBullets size={16} weight="bold" />
        </button>
        <span className="mx-1 h-5 w-px bg-stone-200" />
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyLeft')} title="Align left" className="rounded p-1.5 text-stone-600 hover:bg-stone-100">
          <TextAlignLeft size={16} weight="bold" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyCenter')} title="Align centre" className="rounded p-1.5 text-stone-600 hover:bg-stone-100">
          <TextAlignCenter size={16} weight="bold" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyRight')} title="Align right" className="rounded p-1.5 text-stone-600 hover:bg-stone-100">
          <TextAlignRight size={16} weight="bold" />
        </button>
        {busy ? <span className="ml-1 text-[10px] font-bold text-[#FF5A36]">Uploading…</span> : null}
      </div>

      <div className="flex">
        <div className="relative border-r border-stone-200 px-2">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Insert content"
            className="sticky top-3 mt-3 flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-600 transition-colors hover:border-[#FF5A36] hover:text-[#FF5A36]"
          >
            {menuOpen ? <CaretDown size={16} weight="bold" /> : <Plus size={16} weight="bold" />}
          </button>
          {menuOpen ? (
            <div className="absolute left-2 top-12 z-20 w-44 rounded-xl border border-stone-200 bg-white p-1.5 shadow-[0_12px_30px_rgba(24,24,27,0.12)]">
              {INSERT_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.kind}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insert(option.kind)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-stone-700 hover:bg-[#FFF2EE] hover:text-[#FF5A36]"
                  >
                    <Icon size={15} weight="duotone" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChange(e.currentTarget.innerHTML)}
          onKeyUp={rememberSelection}
          onMouseUp={rememberSelection}
          onBlur={rememberSelection}
          data-placeholder={placeholder}
          className="story-body min-h-[280px] flex-1 px-4 py-4 text-sm leading-relaxed outline-none empty:before:text-stone-400 empty:before:content-[attr(data-placeholder)]"
        />
      </div>

      {/* Inline insert panel — replaces native prompts/alerts */}
      {dialog ? (
        <div className="border-t border-stone-200 bg-[#FCFAF6] p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h4 className="font-editorial text-base font-semibold">{dialogCopy[dialog].title}</h4>
              <p className="mt-0.5 text-[11px] text-stone-500">{dialogCopy[dialog].hint}</p>
            </div>
            <button type="button" onClick={closeDialog} aria-label="Cancel insert" className="rounded-lg border border-stone-200 bg-white p-1.5 text-stone-500 hover:text-[#FF5A36]">
              <X size={15} weight="bold" />
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className={inputClass}
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://…"
              aria-label="Media URL"
            />
            {dialog === 'video' ? (
              <input
                className={inputClass}
                value={form.poster}
                onChange={(e) => setForm({ ...form, poster: e.target.value })}
                placeholder="Poster image URL (optional)"
                aria-label="Poster URL"
              />
            ) : null}
          </div>

          {error ? <p role="alert" className="mt-2 text-[11px] font-semibold text-red-600">{error}</p> : null}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={apply}
              className="rounded-lg bg-[#18181B] px-4 py-2 text-xs font-bold text-white hover:bg-black"
            >
              Insert
            </button>
            <button type="button" onClick={closeDialog} className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-bold text-stone-600">
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple={pendingUpload === 'grid'}
        className="hidden"
        onChange={(e) => void upload(e.target.files)}
      />
    </div>
  );
}
