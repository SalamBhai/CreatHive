/**
 * Auth email templates used by the Supabase "Send Email" hook.
 * Supabase still generates and verifies the tokens — this module only renders
 * the message and hands it to our Brevo transport.
 */

import { getEmailTemplate, sendEmail } from './email';

const CORAL = '#FF5A36';
const MUTED = '#78716C';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const button = (label: string, href: string) =>
  `<div style="text-align:center;margin:28px 0;">
     <a href="${href}" style="display:inline-block;background:${CORAL};color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 30px;border-radius:9999px;">${label}</a>
   </div>`;

const codeBlock = (token: string) =>
  `<div style="margin:24px 0;text-align:center;">
     <span style="display:inline-block;background:#FDFBF7;border:1px solid #E7E5E4;border-radius:12px;padding:14px 24px;font-size:28px;font-weight:800;letter-spacing:0.18em;">${escapeHtml(token)}</span>
   </div>`;

function template(action: string, url: string, token: string, name: string, newEmail: string) {
  const who = escapeHtml(name || 'creative');
  switch (action) {
    case 'signup':
    case 'invite':
      return {
        subject: 'Confirm your CreatHive email',
        heading: 'Welcome to the hive, ' + who + '!',
        body:
          '<p style="margin:0 0 14px;">One last step before your CreatHive space is ready. Confirm your email address below.</p>' +
          button('Confirm email address →', url) +
          `<p style="margin:0;font-size:12px;color:${MUTED};">Built for the limitless creatives.</p>`,
      };
    case 'recovery':
      return {
        subject: 'Reset your CreatHive password',
        heading: 'Reset your password',
        body:
          '<p style="margin:0 0 14px;">We received a request to reset your CreatHive password. Choose a new one below.</p>' +
          button('Choose a new password →', url) +
          `<p style="margin:0;font-size:12px;color:${MUTED};">If you didn&rsquo;t request this, you can ignore this email.</p>`,
      };
    case 'magiclink':
      return {
        subject: 'Your CreatHive sign-in link',
        heading: 'Your sign-in link',
        body:
          '<p style="margin:0 0 14px;">Tap below to sign in to CreatHive. This link expires shortly and can only be used once.</p>' +
          button('Sign in →', url),
      };
    case 'email_change':
      return {
        subject: 'Confirm your new CreatHive email',
        heading: 'Confirm your new email address',
        body:
          `<p style="margin:0 0 14px;">Confirm ${escapeHtml(newEmail)} as your new CreatHive email address.</p>` +
          button('Confirm new email →', url) +
          `<p style="margin:0;font-size:12px;color:${MUTED};">If you didn&rsquo;t request this change, you can ignore this email.</p>`,
      };
    case 'reauthentication':
      return {
        subject: 'Your CreatHive verification code',
        heading: 'Verify it&rsquo;s you',
        body: '<p style="margin:0 0 14px;">Use this one-time code to confirm your identity.</p>' + codeBlock(token),
      };
    case 'password_changed_notification':
      return {
        subject: 'Your CreatHive password was changed',
        heading: 'Password changed',
        body: `<p style="margin:0;">If this wasn&rsquo;t you, reset your password immediately or contact support.</p>`,
      };
    case 'email_changed_notification':
      return {
        subject: 'Your CreatHive email was changed',
        heading: 'Email changed',
        body: `<p style="margin:0;">Your CreatHive email address has been updated.</p>`,
      };
    default:
      return {
        subject: 'CreatHive account notification',
        heading: 'Account update',
        body: '<p style="margin:0;">There was an update to your CreatHive account.</p>' + (url ? button('Open CreatHive →', url) : ''),
      };
  }
}

export async function sendAuthEmail(input: {
  to: string;
  action: string;
  url?: string;
  token?: string;
  displayName?: string;
  newEmail?: string;
}): Promise<boolean> {
  const { subject, heading, body } = template(
    input.action,
    input.url || 'https://creathivee.vercel.app',
    input.token || '',
    input.displayName || '',
    input.newEmail || ''
  );
  const html = getEmailTemplate(`<h2 style="margin:0 0 18px;font-size:24px;line-height:1.25;">${heading}</h2>${body}`);
  return sendEmail({ to: input.to, subject, html });
}
