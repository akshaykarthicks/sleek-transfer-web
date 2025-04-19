
import { FileUploadZone } from "@/components/FileUploadZone";
import AuthButton from "@/components/AuthButton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Clock, FileIcon } from "lucide-react";

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
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        
        const { data } = await supabase
          .from('file_shares')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', threeDaysAgo.toISOString())
          .order('created_at', { ascending: false });
          
        setRecentFiles(data || []);
      }
    };
    
    getUser();
  }, []);

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
          <Card className="mt-8 bg-white/80 backdrop-blur-lg shadow-xl border border-white/20 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock className="w-5 h-5" />
                Recent Shares
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {recentFiles.map((file) => (
                  <Link
                    key={file.id}
                    to={`/share/${file.share_link}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/50 transition-colors group"
                  >
                    <div className="p-2 rounded-md bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
                      <FileIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {file.file_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>Files auto-delete after 7 days • End-to-end encrypted</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
