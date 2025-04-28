import { FileUploadZone } from "@/components/FileUploadZone";
import AuthButton from "@/components/AuthButton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Link as LinkIcon, Copy, Upload, Shield, Clock } from "lucide-react";
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

  const features = [
    {
      icon: <Upload className="w-8 h-8 text-yellow-400" />,
      title: "Easy Upload",
      description: "Drag and drop your files or click to browse"
    },
    {
      icon: <Shield className="w-8 h-8 text-yellow-400" />,
      title: "Secure Sharing",
      description: "End-to-end encryption for your files"
    },
    {
      icon: <Clock className="w-8 h-8 text-yellow-400" />,
      title: "Time-Limited",
      description: "Files auto-delete after 7 days"
    }
  ];

  useEffect(() => {
    const fetchUserAndFiles = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const twoDaysAgo = new Date();
          twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

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
    <div className="min-h-screen flex flex-col bg-black text-yellow-400">
      <div className="absolute top-6 right-6 z-10">
        <AuthButton />
      </div>

      <div className="w-full px-4 py-20 md:py-32 flex flex-col items-center justify-center relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent opacity-50" />
        
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 animate-fade-in">
            Share Files Securely
          </h1>
          <p className="text-lg md:text-xl mb-8 text-yellow-300/80 max-w-2xl mx-auto animate-fade-in">
            Upload and share files up to 2GB with end-to-end encryption. Simple, secure, and fast.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 px-4">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="p-6 rounded-xl bg-yellow-400/5 border border-yellow-400/20 backdrop-blur-sm hover:bg-yellow-400/10 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  {feature.icon}
                  <h3 className="text-xl font-semibold text-yellow-400">{feature.title}</h3>
                  <p className="text-yellow-300/70">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-4 -mt-10 relative z-20">
        <Card className="bg-black/50 backdrop-blur-xl border border-yellow-400/30 shadow-[0_0_15px_rgba(234,179,8,0.2)] rounded-2xl animate-fade-in overflow-hidden">
          <CardContent className="p-8">
            <FileUploadZone />
          </CardContent>
        </Card>
      </div>

      {user && !loading && recentFiles.length > 0 && (
        <div className="w-full max-w-4xl mx-auto px-4 mt-16">
          <Card className="bg-black/50 backdrop-blur-xl border border-yellow-400/30 shadow-[0_0_15px_rgba(234,179,8,0.2)] rounded-2xl animate-fade-in overflow-hidden">
            <CardHeader className="border-b border-yellow-400/20">
              <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-yellow-400">
                <History className="w-6 h-6" />
                Recent Shares
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {recentFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-xl border border-yellow-400/20 bg-yellow-400/5 backdrop-blur-sm hover:bg-yellow-400/10 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 truncate">
                      <div className="flex-shrink-0 p-3 bg-yellow-400/10 rounded-lg text-yellow-400">
                        <LinkIcon className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-semibold text-yellow-400 truncate">
                          {file.file_name}
                        </p>
                        <p className="text-sm text-yellow-300/70">
                          Shared on {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto md:max-w-[60%] truncate bg-yellow-400/5 rounded-lg p-1 pl-3 border border-yellow-400/20">
                      <a
                        href={file.share_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 truncate text-yellow-400 hover:text-yellow-300 transition-colors"
                      >
                        <span className="truncate">{file.share_link}</span>
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(file.share_link)}
                        className="flex-shrink-0 hover:bg-yellow-400/20 text-yellow-400"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {user && loading && (
        <div className="w-full max-w-4xl mx-auto px-4 mt-16 text-center">
          <div className="w-8 h-8 border-4 border-t-transparent border-yellow-400 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-yellow-300/70">Loading recent shares...</p>
        </div>
      )}

      <footer className="mt-auto py-8 text-center text-sm text-yellow-400/60">
        <p>Files auto-delete after 7 days • End-to-end encrypted</p>
      </footer>
    </div>
  );
};

export default Index;
