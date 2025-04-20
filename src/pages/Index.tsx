
import { FileUploadZone } from "@/components/FileUploadZone";
import AuthButton from "@/components/AuthButton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { History, Link as LinkIcon, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FileHistory {
  id: string;
  file_name: string;
  created_at: string;
  share_link: string;
}

const Index = () => {
  const [recentFiles, setRecentFiles] = useState<FileHistory[]>([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const { data } = await supabase
          .from('file_shares')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', twoDaysAgo.toISOString())
          .order('created_at', { ascending: false });

        setRecentFiles(data || []);
      }
    };

    getUser();
  }, []);

  const copyToClipboard = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 relative bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
      <div 
        className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-purple-200 to-blue-200 blur-3xl opacity-30 animate-float"
        style={{ animationDelay: '0s' }}
      />
      <div 
        className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 blur-3xl opacity-30 animate-float"
        style={{ animationDelay: '2s' }}
      />

      {/* Auth Button */}
      <div className="absolute top-6 right-6 z-10">
        <AuthButton />
      </div>

      {/* Main content */}
      <div className="relative w-full max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent animate-fade-in">
            Share Files Securely
          </h1>
          <p className="text-gray-600 text-lg md:text-xl mb-8 animate-fade-in">
            Upload and share files up to 2GB with end-to-end encryption
          </p>
        </div>

        <Card className="bg-white/80 backdrop-blur-lg shadow-xl border border-white/20 animate-fade-in">
          <CardContent className="p-6">
            <FileUploadZone />
          </CardContent>
        </Card>

        {user && recentFiles.length > 0 && (
          <Card className="mt-8 bg-white/90 backdrop-blur-md shadow-xl border border-white/30 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
                <History className="w-6 h-6 text-purple-600" />
                Recent Shares
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {recentFiles.map((file) => (
                  <div 
                    key={file.id} 
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 rounded-lg border border-gray-200 hover:shadow-lg hover:border-purple-300 transition-shadow duration-200"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="p-2 rounded-md bg-purple-100 text-purple-600">
                        <LinkIcon className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-medium text-gray-900 truncate">
                          {file.file_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Shared on {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <a
                        href={file.share_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md border border-purple-600 text-purple-700 hover:bg-purple-600 hover:text-white transition-colors text-sm truncate max-w-xs"
                        title="Open share link"
                      >
                        {file.share_link}
                        <LinkIcon className="w-4 h-4" />
                      </a>
                      <Button 
                        size="sm" variant="outline" 
                        onClick={() => copyToClipboard(file.share_link)}
                        title="Copy share link"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>Files auto-delete after 7 days • End-to-end encrypted</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;

