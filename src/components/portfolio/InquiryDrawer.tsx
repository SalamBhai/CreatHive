'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { PaperPlaneTilt, CheckCircle, UploadSimple, X } from '@phosphor-icons/react';
import { BottomSheet } from '../ui/BottomSheet';
import { NeoButton } from '../ui/NeoButton';
import { useSendInquiry } from '@/lib/store';
import { notifyPush } from '@/lib/push';
import { uploadFile } from '@/lib/upload';
import type { InquiryAttachment, InquiryEventType } from '@/lib/types';

interface InquiryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  creativeId: string;
  creativeName: string;
}

export function InquiryDrawer({
  isOpen,
  onClose,
  creativeId,
  creativeName,
}: InquiryDrawerProps) {
  const [senderName, setSenderName] = useState('');
  const [senderOrg, setSenderOrg] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [eventType, setEventType] = useState<InquiryEventType>('PERFORMANCE');

  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<InquiryAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const inquiryMutation = useSendInquiry();

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadError('');
    const picked = Array.from(files).slice(0, 3 - attachments.length);
    if (!picked.length) {
      setUploadError('You can attach up to 3 images.');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await Promise.all(picked.map((file) => uploadFile(file, 'inquiry')));
      setAttachments((current) =>
        [...current, ...uploaded.map(({ url, publicId }) => ({ url, publicId }))].slice(0, 3)
      );
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName || !senderEmail || !message) return;

    inquiryMutation.mutate(
      {
        creativeId,
        senderName,
        senderOrganization: senderOrg,
        senderEmail,
        senderPhone,
        eventType,
        message,
        attachments,
      },
      {
        onSuccess: (sent) => {
          void notifyPush('new_inquiry', sent.id);
          setIsSuccess(true);
          setTimeout(() => {
            setIsSuccess(false);
            onClose();
            setMessage('');
            setAttachments([]);
          }, 2000);
        },
      }
    );
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`Book ${creativeName}`}
      subtitle="Invite for a performance, creative collaboration, or project inquiry."
    >
      {isSuccess ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center neo-shadow">
            <CheckCircle size={32} weight="fill" />
          </div>
          <h4 className="font-editorial text-xl font-semibold text-[#18181B]">
            Inquiry Sent Successfully!
          </h4>
          <p className="text-xs text-stone-600 max-w-xs font-sans-ui">
            Your message has been delivered to {creativeName}. They will get back to you shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#18181B] mb-1">
                Your Name *
              </label>
              <input
                type="text"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Emmanuel Bamidele"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-xs font-sans-ui focus:bg-[#FFFDF7] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#18181B] mb-1">
                Organization / Team
              </label>
              <input
                type="text"
                value={senderOrg}
                onChange={(e) => setSenderOrg(e.target.value)}
                placeholder="e.g. UNICEF Nigeria / GenU 9JA"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-xs font-sans-ui focus:bg-[#FFFDF7] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#18181B] mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="you@unicef.org"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-xs font-sans-ui focus:bg-[#FFFDF7] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#18181B] mb-1">
                Phone / WhatsApp (Optional)
              </label>
              <input
                type="tel"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="+234..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-xs font-sans-ui focus:bg-[#FFFDF7] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#18181B] mb-1">
              Opportunity / Event Type
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as InquiryEventType)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-xs font-sans-ui outline-none"
            >
              <option value="PERFORMANCE">Creative Performance / Spoken Word / Showcase</option>
              <option value="TECH_DESIGN">UI/UX, Product Engineering or Tech Imagery Project</option>
              <option value="COLLABORATION">Creative Collaboration</option>
              <option value="SPEAKING">Panelist / Speaker / Workshop</option>
              <option value="OTHER">Other Opportunity</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#18181B] mb-1">
              Message / Scope of Opportunity *
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell the creative about the performance opportunity, timeline, and expectations..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-xs font-sans-ui focus:bg-[#FFFDF7] outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#18181B] mb-1">
              Reference images <span className="font-normal text-stone-500">(optional, up to 3)</span>
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-600 transition-colors hover:border-[#FF5A36] hover:text-[#FF5A36]">
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => void addImages(e.target.files)}
              />
              <UploadSimple size={16} weight="bold" />
              {uploading ? 'Uploading…' : 'Attach images'}
            </label>
            {uploadError ? <p className="mt-1.5 text-[11px] text-red-600">{uploadError}</p> : null}
            {attachments.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <span key={`${file.url}-${index}`} className="relative">
                    <Image
                      src={file.url}
                      alt={`Reference ${index + 1}`}
                      width={56}
                      height={56}
                      unoptimized
                      className="h-14 w-14 rounded-lg border border-stone-200 object-cover"
                    />
                    <button
                      type="button"
                      aria-label={`Remove reference ${index + 1}`}
                      onClick={() => setAttachments((current) => current.filter((_, i) => i !== index))}
                      className="absolute -right-1.5 -top-1.5 rounded-full border border-stone-200 bg-white p-0.5 text-stone-600"
                    >
                      <X size={11} weight="bold" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="pt-2">
            <NeoButton
              type="submit"
              disabled={inquiryMutation.isPending || uploading}
              variant="primary"
              size="lg"
              className="w-full"
              icon={<PaperPlaneTilt size={18} weight="bold" />}
            >
              Send Performance Invitation
            </NeoButton>
          </div>
        </form>
      )}
    </BottomSheet>
  );
}
