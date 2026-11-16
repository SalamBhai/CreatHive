'use client';

import React, { useState } from 'react';
import { PaperPlaneTilt, CheckCircle } from '@phosphor-icons/react';
import { BottomSheet } from '../ui/BottomSheet';
import { NeoButton } from '../ui/NeoButton';
import { useSendInquiry } from '@/lib/store';
import type { InquiryEventType } from '@/lib/types';

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
  const [isSuccess, setIsSuccess] = useState(false);

  const inquiryMutation = useSendInquiry();

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
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
          setTimeout(() => {
            setIsSuccess(false);
            onClose();
            // Reset form
            setMessage('');
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
          <h4 className="text-xl font-bold font-sans-ui text-[#18181B]">
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

          <div className="pt-2">
            <NeoButton
              type="submit"
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
