'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';

/** Carousel for the structured gallery fields (not inline WYSIWYG images). */
export function PostGallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  if (!total) return null;

  const go = (direction: -1 | 1) => setIndex((i) => (i + direction + total) % total);

  return (
    <div className="mt-8">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
        <Image
          key={images[index]}
          src={images[index]}
          alt={`${title} — image ${index + 1} of ${total}`}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          unoptimized
          className="object-cover"
        />
        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-stone-200 bg-white/90 p-2 text-stone-700 shadow-sm backdrop-blur transition-colors hover:border-[#FF5A36] hover:text-[#FF5A36]"
            >
              <CaretLeft size={18} weight="bold" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-stone-200 bg-white/90 p-2 text-stone-700 shadow-sm backdrop-blur transition-colors hover:border-[#FF5A36] hover:text-[#FF5A36]"
            >
              <CaretRight size={18} weight="bold" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-[#18181B]/75 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
              {index + 1} / {total}
            </span>
          </>
        ) : null}
      </div>
      {total > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === index ? 'border-[#FF5A36]' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={src} alt="" fill sizes="80px" unoptimized className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
