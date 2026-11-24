'use client';

import { useState } from 'react';
import { ArrowUpRight, CaretLeft, CaretRight, FilePdf, X } from '@phosphor-icons/react';
import { Surface } from '@/components/ui/Surface';
import { pdfPageUrl } from '@/lib/cloudinary-image';

/** Cloudinary forces a download via fl_attachment; the HTML download attribute
 *  is ignored for cross-origin URLs. */
function downloadUrl(url: string): string {
  const marker = '/image/upload/';
  const i = url.indexOf(marker);
  if (i < 0) return url;
  return `${url.slice(0, i + marker.length)}fl_attachment/${url.slice(i + marker.length)}`;
}
import type { CreativePiece } from '@/lib/types';

/** Renders the PDF itself as inline page images. PDFs are uploaded as image
 *  resources, so Cloudinary serves each page via pg_N with no extra files. */
export function PdfAttachment({ piece }: { piece: CreativePiece }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  if (!piece.pdfUrl) return null;

  const pageCount = piece.pdfPageCount || 0;
  const current = Math.min(active, Math.max(pageCount - 1, 0));
  const go = (direction: -1 | 1) => setActive((i) => Math.min(Math.max(i + direction, 0), pageCount - 1));
  const inlinePdf = piece.pdfUrl.includes('/image/upload/') && pageCount > 0;

  return (
    <Surface className="mt-10 p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-500">
          <FilePdf size={14} weight="bold" className="text-[#FF5A36]" />
          Source document
        </p>
        <a
          href={downloadUrl(piece.pdfUrl)}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-500 hover:text-[#FF5A36]"
        >
          Download <ArrowUpRight size={12} weight="bold" />
        </a>
      </div>

      {inlinePdf ? (
        <div>
          <div className="relative min-h-[240px] w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pdfPageUrl(piece.pdfUrl, current + 1, 1200)}
              alt={`Page ${current + 1}`}
              loading="eager"
              decoding="async"
              onClick={() => setLightbox(true)}
              className="block h-auto w-full cursor-zoom-in"
            />
            {pageCount > 1 ? (
              <>
                <button type="button" aria-label="Previous page" disabled={current === 0} onClick={() => go(-1)} className="absolute left-2 top-1/2 rounded-full border border-stone-200 bg-white/90 p-2 shadow-sm backdrop-blur disabled:opacity-40">
                  <CaretLeft size={16} weight="bold" />
                </button>
                <button type="button" aria-label="Next page" disabled={current === pageCount - 1} onClick={() => go(1)} className="absolute right-2 top-1/2 rounded-full border border-stone-200 bg-white/90 p-2 shadow-sm backdrop-blur disabled:opacity-40">
                  <CaretRight size={16} weight="bold" />
                </button>
              </>
            ) : null}
            <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
              {current + 1} / {pageCount}
            </span>
          </div>
          {pageCount > 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {Array.from({ length: pageCount }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Go to page ${index + 1}`}
                  className={`h-14 w-11 shrink-0 overflow-hidden rounded border ${
                    index === current ? 'border-[#FF5A36]' : 'border-stone-200'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pdfPageUrl(piece.pdfUrl, index + 1, 100)} alt="" loading="lazy" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          ) : null}
          <p className="mt-2 text-[10px] text-stone-500">Tap a page to view it full screen.</p>
        </div>
      ) : (
        <a
          href={piece.pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-[#FF5A36] hover:border-[#FF5A36]"
        >
          View PDF <ArrowUpRight size={12} weight="bold" />
        </a>
      )}

      {lightbox && inlinePdf ? (
        <div className="fixed inset-0 z-[90] flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label="Document viewer">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-xs font-bold">{current + 1} / {pageCount}</span>
            <button type="button" onClick={() => setLightbox(false)} aria-label="Close viewer" className="rounded-full bg-white/10 p-2">
              <X size={18} weight="bold" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto px-2 pb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pdfPageUrl(piece.pdfUrl, current + 1, 1600)} alt={`Page ${current + 1}`} className="max-h-full w-auto max-w-full object-contain" />
          </div>
          {pageCount > 1 ? (
            <div className="flex items-center justify-center gap-6 pb-6 text-white">
              <button type="button" onClick={() => go(-1)} disabled={current === 0} aria-label="Previous page" className="rounded-full bg-white/10 p-3 disabled:opacity-30">
                <CaretLeft size={20} weight="bold" />
              </button>
              <button type="button" onClick={() => go(1)} disabled={current === pageCount - 1} aria-label="Next page" className="rounded-full bg-white/10 p-3 disabled:opacity-30">
                <CaretRight size={20} weight="bold" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </Surface>
  );
}
