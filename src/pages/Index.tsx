
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndFiles = async () => {
      try {
        setLoading(true);
        // Get current session
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Calculate date from 2 days ago
          const twoDaysAgo = new Date();
          twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

          // Query recent files with proper error handling
          const { data, error } = await supabase
            .from('file_shares')
            .select('*')
            .eq('user_id', user.id)
            .gte('created_at', twoDaysAgo.toISOString())
            .order('created_at', { ascending: false });

          if (error) {
            console.error("Error fetching files:", error);
            toast.error("Failed to load recent files");
          } else {
            setRecentFiles(data || []);
          }
        }
      } catch (err) {
        console.error("Session error:", err);
      } finally {
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          fetchUserAndFiles();
        } else {
          setRecentFiles([]);
        }
      }
    );

    fetchUserAndFiles();

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
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
      <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 bg-clip-text text-transparent animate-fade-in tracking-tight leading-tight">
            Share Files Securely
          </h1>
          <p className="text-gray-700 text-lg md:text-xl mb-8 animate-fade-in max-w-xl mx-auto leading-relaxed">
            Upload and share files up to 2GB with end-to-end encryption
          </p>
        </div>

        <Card className="bg-white/80 backdrop-blur-lg shadow-xl border border-white/30 rounded-2xl animate-fade-in overflow-hidden">
          <CardContent className="p-8">
            <FileUploadZone />
          </CardContent>
        </Card>

        {user && !loading && recentFiles.length > 0 && (
          <Card className="mt-10 bg-gradient-to-r from-purple-50 to-blue-50 backdrop-blur-lg shadow-xl border border-white/30 rounded-2xl animate-fade-in overflow-hidden">
            <CardHeader className="pb-2 border-b border-gray-100">
              <CardTitle className="flex items-center gap-3 text-3xl font-semibold text-purple-800">
                <History className="w-7 h-7" />
                Recent Shares
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {recentFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-4 truncate">
                      <div className="flex-shrink-0 p-3 bg-purple-100 rounded-lg text-purple-700 select-none shadow-inner">
                        <LinkIcon className="w-7 h-7" />
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <p className="text-lg font-bold text-purple-900 truncate">
                          {file.file_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Shared on {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto md:max-w-[60%] truncate bg-gray-50 rounded-lg p-1 pl-3 border border-gray-200">
                      <a
                        href={file.share_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 truncate text-purple-700 hover:text-purple-900 transition-colors"
                        title="Open share link"
                      >
                        <span className="truncate">{file.share_link}</span>
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(file.share_link)}
                        title="Copy share link"
                        className="flex-shrink-0 hover:bg-purple-100 text-purple-700"
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

        {user && loading && (
          <div className="mt-10 text-center p-8">
            <div className="w-8 h-8 border-4 border-t-transparent border-primary rounded-full animate-spin mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading recent shares...</p>
          </div>
        )}

        <footer className="mt-16 text-center text-xs md:text-sm text-gray-500 font-light select-none">
          <p>Files auto-delete after 7 days • End-to-end encrypted</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
