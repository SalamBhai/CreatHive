'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, ArrowUp, ArrowDown, PencilSimple, Trash, Eye, DotsSixVertical } from '@phosphor-icons/react';
import { Surface } from '@/components/ui/Surface';
import { DISCIPLINE_CONFIG } from '@/components/ui/DisciplineChip';
import { useDeletePiece, useReorderPieces, useUpdatePiece } from '@/lib/store';
import type { CreativePiece } from '@/lib/types';

interface PieceManagerProps {
  pieces: CreativePiece[];
  onEdit: (piece: CreativePiece) => void;
  onRefreshPreview?: () => void;
}

export function PieceManager({ pieces, onEdit, onRefreshPreview }: PieceManagerProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  // Optimistic override: a pending reorder's id order, else the server order.
  // Deriving avoids a state-sync effect; when the query refetches, `pieces`
  // carries the new order and the override is cleared in onSettled.
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null);
  const reorder = useReorderPieces();
  const update = useUpdatePiece();
  const remove = useDeletePiece();

  const byId = new Map(pieces.map((p) => [p.id, p]));
  const ordered = pendingOrder
    ? pendingOrder.map((id) => byId.get(id)).filter(Boolean) as CreativePiece[]
    : pieces;

  const persist = (next: CreativePiece[]) => {
    if (reorder.isPending) return; // block rapid double-moves
    setPendingOrder(next.map((p) => p.id)); // optimistic — instant reorder
    reorder.mutate(next.map((p) => p.id), {
      onSettled: () => {
        setPendingOrder(null); // use the freshly fetched order from the parent
        onRefreshPreview?.();
      },
      onError: () => setPendingOrder(null), // roll back to the server order
    });
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];
    persist(next);
  };

  const drop = (target: number) => {
    if (dragIndex === null || dragIndex === target) return;
    const next = [...ordered];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(target, 0, moved);
    setDragIndex(null);
    persist(next);
  };

  return (
    <div className="space-y-2.5">
      {ordered.map((piece, index) => {
        const config = DISCIPLINE_CONFIG[piece.discipline] || DISCIPLINE_CONFIG.OTHER;
        const Icon = config.icon;
        const status = piece.status || 'PUBLIC';
        return (
          <div
            key={piece.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drop(index)}
            className={`group flex items-center gap-2 rounded-xl border bg-white p-3 transition-colors md:gap-3 md:p-4 ${
              dragIndex === index ? 'border-[#FF5A36] opacity-60' : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            <span className="hidden shrink-0 cursor-grab text-stone-300 active:cursor-grabbing md:block" title="Drag to reorder">
              <DotsSixVertical size={18} weight="bold" />
            </span>
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-200 md:h-11 md:w-11"
              style={{ backgroundColor: config.bg, color: config.color }}
            >
              <Icon size={19} weight="duotone" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/p/${piece.id}`} className="truncate text-sm font-bold text-[#18181B] hover:text-[#FF5A36]">
                  {piece.title}
                </Link>
                {piece.isFeatured ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7ED] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#C2410C]">
                    <Star size={10} weight="fill" /> Featured
                  </span>
                ) : null}
                {status !== 'PUBLIC' ? (
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-stone-600">
                    {status.toLowerCase()}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-[11px] text-stone-500">
                {config.label} · {piece.applauseCount} applauses
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  update.mutate(
                    { id: piece.id, patch: { isFeatured: !piece.isFeatured } },
                    { onSuccess: onRefreshPreview }
                  )
                }
                title={piece.isFeatured ? 'Unfeature' : 'Feature'}
                aria-label={piece.isFeatured ? 'Unfeature piece' : 'Feature piece'}
                className={`rounded-lg border p-2 transition-colors ${
                  piece.isFeatured
                    ? 'border-[#FFAE19] bg-[#FFF7ED] text-[#F59E0B]'
                    : 'border-stone-200 text-stone-500 hover:border-[#FFAE19] hover:text-[#F59E0B]'
                }`}
              >
                <Star size={15} weight={piece.isFeatured ? 'fill' : 'regular'} />
              </button>
              <div className="flex flex-col">
                <button type="button" onClick={() => move(index, -1)} aria-label="Move up" className="rounded p-0.5 text-stone-400 hover:text-[#18181B]">
                  <ArrowUp size={13} weight="bold" />
                </button>
                <button type="button" onClick={() => move(index, 1)} aria-label="Move down" className="rounded p-0.5 text-stone-400 hover:text-[#18181B]">
                  <ArrowDown size={13} weight="bold" />
                </button>
              </div>
              <button type="button" onClick={() => onEdit(piece)} aria-label={`Edit ${piece.title}`} className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:border-[#FF5A36] hover:text-[#FF5A36]">
                <PencilSimple size={15} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete “${piece.title}”? This can't be undone.`)) {
                    remove.mutate(piece.id, { onSuccess: onRefreshPreview });
                  }
                }}
                aria-label={`Delete ${piece.title}`}
                className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:border-red-500 hover:text-red-600"
              >
                <Trash size={15} weight="bold" />
              </button>
              <Link href={`/p/${piece.id}`} aria-label={`View ${piece.title}`} className="hidden rounded-lg border border-stone-200 p-2 text-stone-500 hover:border-[#FF5A36] hover:text-[#FF5A36] lg:block">
                <Eye size={15} weight="bold" />
              </Link>
            </div>
          </div>
        );
      })}
      {ordered.length === 0 ? (
        <Surface className="py-12 text-center text-sm text-stone-500">No pieces yet. Publish your first work.</Surface>
      ) : null}
    </div>
  );
}
