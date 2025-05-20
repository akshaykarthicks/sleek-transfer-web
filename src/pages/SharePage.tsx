
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FileIcon, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileShare } from "@/types/supabase";

const SharePage = () => {
  const { shareId } = useParams();
  const [fileData, setFileData] = useState<FileShare | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchFileData = async () => {
      try {
        if (!shareId) {
          setError("Invalid share link");
          setLoading(false);
          return;
        }

        const shareLink = `${window.location.origin}/share/${shareId}`;
        
        // Use type assertion for the table
        const { data, error } = await (supabase
          .from('file_shares') as any)
          .select('*')
          .eq('share_link', shareLink)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          setError("File not found or link has expired");
        } else {
          setFileData(data);
          
          // Log file access
          const { error: activityError } = await (supabase
            .from('user_activities') as any)
            .insert({
              activity_type: 'view',
              file_id: data.id,
              ip_address: await fetchIpAddress()
            });
            
          if (activityError) {
            console.error("Error logging view activity:", activityError);
          }
        }
      } catch (err: any) {
        console.error("Error fetching file data:", err);
        setError(err.message || "Failed to load file data");
      } finally {
        setLoading(false);
      }
    };

    fetchFileData();
  }, [shareId]);

  const fetchIpAddress = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error("Could not fetch IP address:", error);
      return null;
    }
  };

  const handleDownload = async () => {
    if (!fileData?.file_url) {
      toast.error("File URL not available");
      return;
    }
    
    setIsDownloading(true);
    
    try {
      // Log the download activity
      const { error: downloadLogError } = await (supabase
        .from('file_downloads') as any)
        .insert({
          file_share_id: fileData.id,
          ip_address: await fetchIpAddress()
        });
        
      if (downloadLogError) {
        console.error("Error logging download:", downloadLogError);
      }
      
      // Also log in the activities table
      const { error: activityError } = await (supabase
        .from('user_activities') as any)
        .insert({
          activity_type: 'download',
          file_id: fileData.id,
          ip_address: await fetchIpAddress()
        });
        
      if (activityError) {
        console.error("Error logging download activity:", activityError);
      }
      
      const response = await fetch(fileData.file_url);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileData.file_name;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      toast.success("File downloaded successfully!");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download file");
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes && bytes !== 0) return "Unknown size";
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown date";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (err) {
      return "Invalid date";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-50" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="text-center relative z-10">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading shared file...</p>
        </div>
      </div>
    );
  }

  if (error || !fileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-50" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="bg-black/50 backdrop-blur-xl rounded-2xl p-8 shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/10 max-w-md w-full text-center relative z-10">
          <AlertCircle className="w-16 h-16 text-white/80 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4 text-white">File Not Available</h1>
          <p className="text-white/70 mb-6">{error || "This file is no longer available or the link has expired."}</p>
          <Button 
            onClick={() => window.location.href = "/"} 
            className="bg-white/10 hover:bg-white/20 text-white border border-white/10"
          >
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-50" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      
      <div className="bg-black/50 backdrop-blur-xl rounded-2xl p-8 shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/10 max-w-md w-full relative z-10">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
            <FileIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-xl font-bold truncate text-white">{fileData?.file_name}</h1>
          <p className="text-white/50 text-sm mt-1">{formatFileSize(fileData?.file_size)}</p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
            <div className="text-sm text-white/70">
              <p className="flex justify-between">
                <span>Available until:</span>
                <span className="font-medium text-white">{formatDate(fileData?.expires_at)}</span>
              </p>
              <p className="flex justify-between mt-2">
                <span>Shared on:</span>
                <span className="font-medium text-white">{formatDate(fileData?.created_at)}</span>
              </p>
            </div>
          </div>
          
          <Button 
            className="w-full gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/10" 
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Downloading...
              </>
            ) : (
              <>
                <Download size={16} />
                Download File
              </>
            )}
          </Button>
          
          <p className="text-xs text-center text-white/50 mt-4">
            This file will be available for download until {formatDate(fileData?.expires_at)}
          </p>
        </div>
      </div>
      
      <div className="absolute bottom-4 text-center w-full text-white/30 text-xs">
        © 2025 Akshay Karthick S
      </div>
    </div>
  );
};

export default SharePage;
