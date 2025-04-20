import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { initOAuth2Client, getTokens } from '@/lib/gmail';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  try {
    const oauth2Client = initOAuth2Client(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
    );

    const tokens = await getTokens(oauth2Client, code);

    // Store tokens in session or database
    // For now, we'll just redirect back to the app
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    return NextResponse.json({ error: 'Failed to authenticate' }, { status: 500 });
  }
} 