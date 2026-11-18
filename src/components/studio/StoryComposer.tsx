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
  FilePdf,
  Minus,
  TextB,
  TextItalic,
  LinkSimple,
  ListBullets,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
} from '@phosphor-icons/react';
import { toEmbedUrl } from '@/lib/media';
import { uploadFile } from '@/lib/upload';

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface StoryComposerProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

type InsertKind = 'text' | 'heading' | 'quote' | 'image' | 'grid' | 'video' | 'embed' | 'pdf' | 'divider';

const INSERT_OPTIONS: Array<{ kind: InsertKind; label: string; icon: React.ElementType }> = [
  { kind: 'text', label: 'Text', icon: TextT },
  { kind: 'heading', label: 'Heading', icon: TextT },
  { kind: 'quote', label: 'Quote', icon: Quotes },
  { kind: 'image', label: 'Image', icon: ImageIcon },
  { kind: 'grid', label: 'Photo grid', icon: CaretRight },
  { kind: 'video', label: 'Video / Audio', icon: PlayCircle },
  { kind: 'embed', label: 'Embed', icon: Code },
  { kind: 'pdf', label: 'PDF', icon: FilePdf },
  { kind: 'divider', label: 'Divider', icon: Minus },
];

export function StoryComposer({ value, onChange, placeholder = 'Tell your story…' }: StoryComposerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const imageInput = useRef<HTMLInputElement>(null);
  const gridInput = useRef<HTMLInputElement>(null);
  const caption = useRef('');

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

  const insert = (kind: InsertKind) => {
    setMenuOpen(false);
    if (kind === 'text') return exec('insertHTML', '<p>Write your text here.</p>');
    if (kind === 'heading') return exec('insertHTML', '<h2>A section heading</h2>');
    if (kind === 'quote') return exec('insertHTML', '<blockquote>A thought worth keeping.</blockquote>');
    if (kind === 'divider') return exec('insertHTML', '<hr />');

    if (kind === 'image') {
      const url = window.prompt('Image URL — leave blank to upload a file');
      if (url) {
        const cap = window.prompt('Caption (optional)') || '';
        return exec('insertHTML', `<figure><img src="${url}" alt="" />${cap ? `<figcaption>${escapeHtml(cap)}</figcaption>` : ''}</figure>`);
      }
      caption.current = window.prompt('Caption (optional)') || '';
      imageInput.current?.click();
      return;
    }

    if (kind === 'grid') {
      const raw = window.prompt('Image URLs — comma separated, or leave blank to upload files');
      if (raw) {
        const imgs = raw.split(',').map((s) => s.trim()).filter(Boolean);
        return exec('insertHTML', `<div class="photo-grid">${imgs.map((u) => `<img src="${u}" alt="" />`).join('')}</div>`);
      }
      gridInput.current?.click();
      return;
    }

    if (kind === 'video') {
      const url = window.prompt('Video / audio URL');
      if (!url) return;
      const embed = toEmbedUrl(url);
      if (embed) {
        return exec('insertHTML', `<figure><div class="video-frame"><iframe src="${embed}" allowfullscreen></iframe></div></figure>`);
      }
      const poster = window.prompt('Poster image URL (optional)') || '';
      return exec('insertHTML', `<figure><video controls ${poster ? `poster="${poster}"` : ''} src="${url}"></video></figure>`);
    }

    if (kind === 'embed') {
      const url = window.prompt('Embed URL (YouTube / Vimeo)');
      if (!url) return;
      const embed = toEmbedUrl(url);
      if (!embed) {
        window.alert('Only YouTube and Vimeo links can be embedded. Try Video / Audio instead.');
        return;
      }
      return exec('insertHTML', `<figure><div class="video-frame"><iframe src="${embed}" allowfullscreen></iframe></div></figure>`);
    }

    if (kind === 'pdf') {
      const url = window.prompt('PDF URL');
      if (!url) return;
      return exec('insertHTML', `<p><a class="pdf-link" href="${url}" target="_blank" rel="noreferrer">View the case study PDF ↗</a></p>`);
    }
  };

  const handleUploadedFiles = async (files: FileList | null, kind: 'image' | 'grid') => {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = await Promise.all(Array.from(files).map((file) => uploadFile(file, 'gallery')));
      if (kind === 'image') {
        const cap = caption.current;
        exec(
          'insertHTML',
          `<figure><img src="${uploaded[0].url}" alt="" />${
            cap ? `<figcaption>${escapeHtml(cap)}</figcaption>` : ''
          }</figure>`
        );
      } else {
        exec('insertHTML', `<div class="photo-grid">${uploaded.map((u) => `<img src="${u.url}" alt="" />`).join('')}</div>`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
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
          onClick={() => {
            const url = window.prompt('Link URL');
            if (url) exec('createLink', url);
          }}
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
        {uploading ? <span className="ml-1 text-[10px] font-bold text-[#FF5A36]">Uploading…</span> : null}
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
      <input
        ref={imageInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void handleUploadedFiles(e.target.files, 'image');
          e.target.value = '';
        }}
      />
      <input
        ref={gridInput}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleUploadedFiles(e.target.files, 'grid');
          e.target.value = '';
        }}
      />
      {error ? (
        <p role="alert" className="border-t border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
