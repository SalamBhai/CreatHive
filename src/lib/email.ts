/**
 * CreatHive email service.
 *
 * Structure modelled on the Dattego (upcycler-nextjs) mailer:
 *   1. one transport-aware `sendEmail()` that fails soft and returns a boolean
 *   2. one `getEmailTemplate()` layout wrapper (inline-CSS, table-based)
 *   3. small per-purpose `sendXEmail()` presets built on the wrapper
 *
 * Transport selection: Brevo REST API when BREVO_API_KEY is set (works with the
 * xkeysib-* key), otherwise nodemailer SMTP (Brevo relay or any SMTP provider).
 */

import type { Transporter } from 'nodemailer';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://creathive.app';
const FROM_EMAIL = process.env.SMTP_FROM || 'creathivee@gmail.com';
const FROM_NAME = process.env.SMTP_FROM_NAME || 'Hiver of CreatHive';

const BRAND = {
  ink: '#18181B',
  coral: '#FF5A36',
  amber: '#FFAE19',
  paper: '#FDFBF7',
  muted: '#78716C',
  line: '#E7E5E4',
} as const;

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Accepts both "name <email@x>" and plain "email@x". */
function parseSender(from?: string, fromName?: string) {
  const raw = (from || FROM_EMAIL).trim();
  const match = raw.match(/^(.*?)\s*<([^>]+)>$/);
  return {
    name: fromName || (match ? match[1].trim() : FROM_NAME),
    email: match ? match[2].trim() : raw,
  };
}

/* ------------------------------------------------------------------ */
/* Transport                                                           */
/* ------------------------------------------------------------------ */

let cachedTransporter: Promise<Transporter> | null = null;

async function getTransporter(): Promise<Transporter | null> {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.warn('[email] SMTP_HOST not configured — SMTP transport disabled');
    return null;
  }
  if (!cachedTransporter) {
    cachedTransporter = import('nodemailer').then(({ default: nodemailer }) =>
      nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465, // STARTTLS on 587
        ...(process.env.SMTP_USER && process.env.SMTP_PASS
          ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
          : {}),
      })
    );
  }
  return cachedTransporter;
}

async function sendViaBrevo(options: SendEmailOptions): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY!;
  const sender = parseSender(options.from, options.fromName);
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender,
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent: options.html,
      textContent: options.text || htmlToText(options.html),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('[email] Brevo API failed', {
      to: options.to,
      subject: options.subject,
      status: response.status,
      detail: detail.slice(0, 500),
    });
    return false;
  }

  console.log('[email] Sent via Brevo', { to: options.to, subject: options.subject });
  return true;
}

async function sendViaSmtp(options: SendEmailOptions): Promise<boolean> {
  const transporter = await getTransporter();
  if (!transporter) return false;

  const sender = parseSender(options.from, options.fromName);
  const info = await transporter.sendMail({
    from: `${sender.name} <${sender.email}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || htmlToText(options.html),
  });
  console.log('[email] Sent via SMTP', {
    to: options.to,
    subject: options.subject,
    messageId: info.messageId,
  });
  return true;
}

/**
 * Send an email. Never throws: returns true on success, false when skipped or
 * failed, so callers (e.g. signup) can stay non-blocking.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    if (process.env.BREVO_API_KEY) return await sendViaBrevo(options);
    return await sendViaSmtp(options);
  } catch (error) {
    console.error('[email] Send failed', {
      to: options.to,
      subject: options.subject,
      message: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Layout + templates                                                  */
/* ------------------------------------------------------------------ */

/** Full email document: accent bar, wordmark header, content, footer. */
export function getEmailTemplate(content: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:${BRAND.paper};font-family:Arial,Helvetica,sans-serif;color:${BRAND.ink};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid ${BRAND.line};border-radius:16px;overflow:hidden;">
        <tr><td style="height:4px;background:linear-gradient(90deg,${BRAND.coral},${BRAND.amber});font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:24px 32px;border-bottom:1px solid ${BRAND.line};">
          <span style="font-size:22px;font-weight:800;letter-spacing:-0.04em;color:${BRAND.ink};">Creat<span style="color:${BRAND.coral};">Hive</span></span>
          <span style="float:right;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.muted};">A commons for creatives</span>
        </td></tr>
        <tr><td style="padding:36px 32px;line-height:1.65;font-size:15px;">
          ${content}
        </td></tr>
        <tr><td style="padding:22px 32px;border-top:1px solid ${BRAND.line};background:${BRAND.paper};font-size:11px;line-height:1.6;color:${BRAND.muted};">
          <strong style="color:${BRAND.ink};">Hiver of CreatHive</strong><br />
          A commons for the limitless creatives.<br />
          &copy; ${year} CreatHive &middot; <a href="${SITE_URL}" style="color:${BRAND.coral};text-decoration:none;">creathive.app</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(label: string, href: string): string {
  return `<div style="text-align:center;margin:30px 0;">
    <a href="${href}" style="display:inline-block;background:${BRAND.coral};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 30px;border-radius:9999px;">${label}</a>
  </div>`;
}

/** Welcome email — sent after a successful signup (non-blocking). */
export async function sendWelcomeEmail({
  email,
  name,
}: {
  email: string;
  name: string;
}): Promise<boolean> {
  const safeName = escapeHtml(name || 'creative');
  const content = `
    <h2 style="margin:0 0 18px;font-size:24px;line-height:1.25;">Welcome to the hive, ${safeName}!</h2>
    <p style="margin:0 0 14px;">Your CreatHive space is ready. It&rsquo;s one quiet place for your work, your story, and the people who want to book you.</p>
    <p style="margin:0 0 14px;">Add your first piece, shape your profile, and make the page yours.</p>
    ${button('Open your Studio →', `${SITE_URL}/studio`)}
    <p style="margin:0;font-size:13px;color:${BRAND.muted};">Or <a href="${SITE_URL}/explore" style="color:${BRAND.coral};text-decoration:none;">explore the hive</a> first.</p>`;
  return sendEmail({
    to: email,
    subject: 'Welcome to CreatHive',
    html: getEmailTemplate(content),
    text: `Welcome to the hive, ${name}! Your CreatHive space is ready: ${SITE_URL}/studio`,
  });
}

/** Password reset — kept ready for a custom reset flow; Supabase Auth sends its own by default. */
export async function sendPasswordResetEmail({
  email,
  resetUrl,
}: {
  email: string;
  resetUrl: string;
}): Promise<boolean> {
  const content = `
    <h2 style="margin:0 0 18px;font-size:24px;line-height:1.25;">Reset your password</h2>
    <p style="margin:0 0 14px;">We received a request to reset your CreatHive password.</p>
    ${button('Choose a new password →', resetUrl)}
    <p style="margin:0;font-size:13px;color:${BRAND.muted};">If you didn&rsquo;t request this, you can safely ignore this email.</p>`;
  return sendEmail({
    to: email,
    subject: 'Password reset — CreatHive',
    html: getEmailTemplate(content),
    text: `Reset your CreatHive password: ${resetUrl}`,
  });
}
