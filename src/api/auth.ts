import { initOAuth2Client, getTokens } from '@/lib/gmail';
import { getViteEnv } from '@/lib/env';

export async function handleAuthCallback(code: string) {
  try {
    const oauth2Client = initOAuth2Client(
      getViteEnv('VITE_GOOGLE_CLIENT_ID'),
      getViteEnv('VITE_GOOGLE_CLIENT_SECRET'),
      getViteEnv('VITE_APP_URL')
    );

    const tokens = await getTokens(oauth2Client, code);
    return tokens;
  } catch (error) {
    console.error('Error handling auth callback:', error);
    throw error;
  }
} 