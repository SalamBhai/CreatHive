/** Simple, minimal email service for CreatHive.
 *  Uses Brevo (SendinBlue) custom SMTP via env vars.
 *  Templates are clean & minimal — no neo-brutal box styling.
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

/** Build a nodemailer transporter using Brevo env vars. */
export async function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host) {
    console.warn('[email] SMTP_HOST not configured — email disabled');
    return null;
  }

  const nodemailer = await import('nodemailer');
  return nodemailer.default.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });
}

/** Send a simple plain‑text + HTML email via the configured SMTP transport. */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
}: SendEmailOptions): Promise<boolean> {
  const transporter = await getTransporter();
  if (!transporter) return false;

  const sender = from || process.env.SMTP_FROM || 'no-reply@creathive.app';

  try {
    const info = await transporter.sendMail({
      from: sender,
      to,
      subject,
      html,
      text: text || (html ? html.replace(/<[^>]+>/gm, '').trim() : subject),
    });
    console.log(`[email] Sent to ${to}, msgId: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error('[email] Send failed:', err);
    return false;
  }
}

/** Welcome email — simple, minimal. */
export async function sendWelcomeEmail({ email, name }: { email: string; name: string }): Promise<boolean> {
  const siteUrl = process.env.NEXTAUTH_URL || 'https://creathive.app';
  const text = `Welcome to CreatHive, ${name}! ${siteUrl}`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2>Welcome to CreatHive, ${name}!</h2>
      <p>Your account has been created successfully.</p>
      <p>Visit <a href="${siteUrl}">CreatHive</a> to start sharing your work.</p>
    </div>
  `;
  return sendEmail({ to: email, subject: 'Welcome to CreatHive', html, text });
}

/** Password‑reset email — simple and minimal. */
export async function sendPasswordResetEmail({ email, resetUrl }: { email: string; resetUrl: string }): Promise<boolean> {
  const siteUrl = process.env.NEXTAUTH_URL || 'https://creathive.app';
  const text = `Password reset request for CreatHive. ${siteUrl}`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2>Password reset</h2>
      <p>We received a request to reset your password.</p>
      <p>Click <a href="${resetUrl}">here</a> to choose a new password.</p>
      <p>If you didn't request this, simply ignore this email.</p>
    </div>
  `;
  return sendEmail({ to: email, subject: 'Password reset — CreatHive', html, text });
}