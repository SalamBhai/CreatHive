import { NextResponse } from 'next/server';
import { signUpUser, validateSignUpInput } from '@/lib/server-auth';
import type { CreativeDiscipline } from '@/lib/types';
import { logError } from '@/lib/logger';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const input = {
    email: typeof body.email === 'string' ? body.email.trim() : '',
    password: typeof body.password === 'string' ? body.password : '',
    username: typeof body.username === 'string' ? body.username.trim() : '',
    displayName: typeof body.displayName === 'string' ? body.displayName.trim() : '',
    disciplines: Array.isArray(body.disciplines)
      ? (body.disciplines as CreativeDiscipline[])
      : [],
  };

  const invalid = validateSignUpInput(input);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  try {
    const result = await signUpUser(input as Parameters<typeof signUpUser>[0]);

    // The confirmation email is handled by Supabase's Send Email hook
    // (/api/auth/send-email). Sending a separate welcome email too would
    // double-send on signup and confuse recipients.

    if (result.status === 'confirmation_sent') {
      return NextResponse.json(
        { status: 'confirmation_sent', email: result.user.email },
        { status: 202 }
      );
    }
    return NextResponse.json({ status: 'created', user: result.user }, { status: 201 });
  } catch (err) {
    logError('signup', 'Signup request failed', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Something went wrong.' },
      { status: 500 }
    );
  }
}
