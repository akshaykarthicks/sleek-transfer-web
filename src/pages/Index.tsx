
import { FileUploadZone } from "@/components/FileUploadZone";
import AuthButton from "@/components/AuthButton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 bg-clip-text text-transparent animate-fade-in tracking-tight leading-tight">
            Share Files Securely
          </h1>
          <p className="text-gray-700 text-lg md:text-xl mb-8 animate-fade-in max-w-xl mx-auto leading-relaxed">
            Upload and share files up to 2GB with end-to-end encryption
          </p>
        </div>

        <Card className="bg-white/80 backdrop-blur-lg shadow-lg border border-white/30 rounded-2xl animate-fade-in">
          <CardContent className="p-8">
            <FileUploadZone />
          </CardContent>
        </Card>

        {user && recentFiles.length > 0 && (
          <Card className="mt-10 bg-gradient-to-r from-purple-50 to-blue-50 backdrop-blur-lg shadow-2xl border border-white/30 rounded-2xl animate-fade-in">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-3xl font-semibold text-purple-800">
                <History className="w-7 h-7" />
                Recent Shares
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {recentFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-xl border border-gray-300 bg-white/70 backdrop-blur-sm shadow hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="flex items-center gap-4 truncate">
                      <div className="flex-shrink-0 p-3 bg-purple-100 rounded-lg text-purple-700 select-none">
                        <LinkIcon className="w-7 h-7" />
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <p className="text-lg font-semibold text-gray-900 truncate">
                          {file.file_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Shared on {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 max-w-full md:max-w-[70%] truncate">
                      <a
                        href={file.share_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-600 text-purple-700 font-medium text-sm truncate max-w-full hover:bg-purple-600 hover:text-white transition-colors"
                        title="Open share link"
                      >
                        <LinkIcon className="w-4 h-4" />
                        <span className="truncate">{file.share_link}</span>
                      </a>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(file.share_link)}
                        title="Copy share link"
                        className="flex-shrink-0"
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

        <footer className="mt-16 text-center text-xs md:text-sm text-gray-500 font-light select-none">
          <p>Files auto-delete after 7 days • End-to-end encrypted</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;

