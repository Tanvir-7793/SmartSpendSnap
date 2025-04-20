import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { initOAuth2Client, getAuthUrl, processReceiptEmails } from '@/lib/gmail';
import { handleAuthCallback } from '@/api/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getViteEnv } from '@/lib/env';

interface GmailIntegrationProps {
  onReceiptsProcessed: (results: any[]) => void;
}

export const GmailIntegration = ({ onReceiptsProcessed }: GmailIntegrationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Initialize OAuth2 client with your credentials
  const oauth2Client = initOAuth2Client(
    getViteEnv('VITE_GOOGLE_CLIENT_ID'),
    getViteEnv('VITE_GOOGLE_CLIENT_SECRET'),
    getViteEnv('VITE_APP_URL')
  );

  // Check for auth code in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      handleAuth(code);
    }
  }, []);

  const handleAuth = async (code: string) => {
    try {
      setIsLoading(true);
      await handleAuthCallback(code);
      setIsAuthenticated(true);
      toast({
        description: "Successfully authenticated with Gmail",
      });
      // Remove code from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: "Authentication Error",
        description: "Failed to authenticate with Gmail",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = getAuthUrl(oauth2Client);
  };

  const handleProcessEmails = async () => {
    try {
      setIsLoading(true);
      const results = await processReceiptEmails(oauth2Client);
      onReceiptsProcessed(results);
      toast({
        description: `Processed ${results.length} receipt emails`,
      });
    } catch (error) {
      console.error('Error processing emails:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process receipt emails",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gmail Integration</CardTitle>
        <CardDescription>
          Connect your Gmail to automatically scan receipt emails
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!isAuthenticated ? (
            <Button
              onClick={handleConnect}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Connect Gmail Account'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleProcessEmails}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Emails...
                </>
              ) : (
                'Scan Recent Receipts'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 