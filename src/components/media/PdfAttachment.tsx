'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, CaretLeft, CaretRight, FilePdf } from '@phosphor-icons/react';
import { Surface } from '@/components/ui/Surface';
import { cloudinaryImageUrl, thumbnailUrl } from '@/lib/cloudinary-image';
import type { CreativePiece } from '@/lib/types';

/** A PDF is the source artifact. Converted page images are the fast,
 *  mobile-friendly way to browse it; the original stays one tap away. */
export function PdfAttachment({ piece }: { piece: CreativePiece }) {
  const [active, setActive] = useState(piece.pdfCoverPage ?? 0);
  if (!piece.pdfUrl) return null;

  const pages = piece.pdfPageImages || [];
  const current = Math.min(Math.max(active, 0), Math.max(pages.length - 1, 0));

  return (
    <Surface className="mt-10 p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-500">
          <FilePdf size={14} weight="bold" className="text-[#FF5A36]" />
          Source document
        </p>
        <a
          href={piece.pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF5A36] hover:underline"
        >
          Open PDF <ArrowUpRight size={14} weight="bold" />
        </a>
      </div>

      {pages.length ? (
        <div>
          <div className="relative min-h-[240px] w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
            {/* Keep the page's natural aspect ratio, like a feed photo. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cloudinaryImageUrl(pages[current], 1200)}
              alt={`Page ${current + 1}`}
              loading="eager"
              decoding="async"
              className="block h-auto w-full"
            />
            {pages.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={current === 0}
                  onClick={() => setActive(current - 1)}
                  className="absolute left-2 top-1/2 rounded-full border border-stone-200 bg-white/90 p-2 text-stone-700 disabled:opacity-40"
                >
                  <CaretLeft size={16} weight="bold" />
                </button>
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={current === pages.length - 1}
                  onClick={() => setActive(current + 1)}
                  className="absolute right-2 top-1/2 rounded-full border border-stone-200 bg-white/90 p-2 text-stone-700 disabled:opacity-40"
                >
                  <CaretRight size={16} weight="bold" />
                </button>
              </>
            ) : null}
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
              {current + 1} / {pages.length}
            </span>
          </div>
          {pages.length > 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {pages.map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Go to page ${index + 1}`}
                  className={`h-14 w-11 shrink-0 overflow-hidden rounded border ${
                    index === current ? 'border-[#FF5A36]' : 'border-stone-200'
                  }`}
                >
                  <Image src={thumbnailUrl(url)} alt="" width={44} height={56} unoptimized loading="lazy" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-50" style={{ aspectRatio: '1 / 1.2' }}>
          <iframe src={piece.pdfUrl} title="Source document PDF" className="h-full w-full border-0" />
        </div>
      )}
    </Surface>
  );
}
