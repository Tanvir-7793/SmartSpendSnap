import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { analyzeReceipt } from './gemini';

// Gmail API scopes
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// Initialize OAuth2 client
export const initOAuth2Client = (clientId: string, clientSecret: string, redirectUri: string): OAuth2Client => {
  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
};

// Generate authentication URL
export const getAuthUrl = (oauth2Client: OAuth2Client): string => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
};

// Get tokens from authorization code
export const getTokens = async (oauth2Client: OAuth2Client, code: string) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
};

// Fetch recent receipt emails
export const fetchReceiptEmails = async (oauth2Client: OAuth2Client) => {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  // Search for receipt emails
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: 'subject:receipt OR from:amazon',
    maxResults: 5
  });

  const messages = response.data.messages || [];
  const emailDetails = [];

  for (const message of messages) {
    const email = await gmail.users.messages.get({
      userId: 'me',
      id: message.id!,
      format: 'full'
    });

    const headers = email.data.payload?.headers;
    const subject = headers?.find(h => h.name === 'Subject')?.value;
    const from = headers?.find(h => h.name === 'From')?.value;
    const date = headers?.find(h => h.name === 'Date')?.value;

    // Extract email body
    let body = '';
    if (email.data.payload?.parts) {
      // Handle multipart emails
      for (const part of email.data.payload.parts) {
        if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
          const data = part.body?.data;
          if (data) {
            body += Buffer.from(data, 'base64').toString('utf-8');
          }
        }
      }
    } else if (email.data.payload?.body?.data) {
      // Handle single part emails
      body = Buffer.from(email.data.payload.body.data, 'base64').toString('utf-8');
    }

    emailDetails.push({
      id: message.id,
      subject,
      from,
      date,
      body
    });
  }

  return emailDetails;
};

// Process emails and analyze receipts
export const processReceiptEmails = async (oauth2Client: OAuth2Client) => {
  try {
    const emails = await fetchReceiptEmails(oauth2Client);
    const results = [];

    for (const email of emails) {
      // Send email body to Gemini for analysis
      const analysis = await analyzeReceipt(email.body);
      results.push({
        email,
        analysis
      });
    }

    return results;
  } catch (error) {
    console.error('Error processing receipt emails:', error);
    throw error;
  }
}; 