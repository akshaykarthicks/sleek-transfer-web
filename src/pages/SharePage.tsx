
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FileIcon, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SharePage = () => {
  const { shareId } = useParams();
  const [fileData, setFileData] = useState<any>(null);
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
        
        const { data, error } = await supabase
          .from('file_shares')
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

  const handleDownload = async () => {
    if (!fileData) {
      toast.error("No file data available");
      return;
    }
    
    setIsDownloading(true);
    
    try {
      // Get file extension from filename
      const fileName = fileData.file_name || "download.txt";
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'txt';
      
      // Set MIME type based on file extension
      let mimeType = 'text/plain';
      
      // Common MIME types for popular file formats
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
        mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
      } else if (['pdf'].includes(fileExtension)) {
        mimeType = 'application/pdf';
      } else if (['doc', 'docx'].includes(fileExtension)) {
        mimeType = 'application/msword';
      } else if (['xls', 'xlsx'].includes(fileExtension)) {
        mimeType = 'application/vnd.ms-excel';
      } else if (['mp3', 'wav'].includes(fileExtension)) {
        mimeType = `audio/${fileExtension}`;
      } else if (['mp4', 'webm'].includes(fileExtension)) {
        mimeType = `video/${fileExtension}`;
      }
      
      // This is a mock download since we don't have actual file storage
      // In a real implementation, you would fetch the file from storage
      
      // Create mock content - in a real app this would be actual file data
      const mockContent = `This is a mock file content for ${fileData.file_name}.
      In a production environment, this would be the actual file content.
      File name: ${fileData.file_name}
      File size: ${formatFileSize(fileData.file_size)}
      Shared on: ${formatDate(fileData.created_at)}
      Expires on: ${formatDate(fileData.expires_at)}`;
      
      // For images and binaries, create a mock binary blob
      const isBinary = mimeType.startsWith('image/') || 
                      mimeType.startsWith('audio/') || 
                      mimeType.startsWith('video/') || 
                      mimeType === 'application/pdf';
      
      // Create a Blob with the appropriate MIME type
      const blob = isBinary 
        ? new Blob([new Uint8Array(100).fill(0)], { type: mimeType }) // Mock binary data
        : new Blob([mockContent], { type: mimeType });
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      
      // Create and click the download link
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("File downloaded successfully!");
        setIsDownloading(false);
      }, 100);
    } catch (err: any) {
      console.error("Download error:", err);
      toast.error("Failed to download file: " + (err.message || "Unknown error"));
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared file...</p>
        </div>
      </div>
    );
  }

  if (error || !fileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">File Not Available</h1>
          <p className="text-gray-600 mb-6">{error || "This file is no longer available or the link has expired."}</p>
          <Button onClick={() => window.location.href = "/"}>
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  // Format the file size
  const formatFileSize = (bytes: number) => {
    if (!bytes && bytes !== 0) return "Unknown size";
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  // Format date
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileIcon className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-xl font-bold truncate">{fileData.file_name}</h1>
          <p className="text-gray-500 text-sm mt-1">{formatFileSize(fileData.file_size)}</p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">
              <p className="flex justify-between">
                <span>Available until:</span>
                <span className="font-medium">{formatDate(fileData.expires_at)}</span>
              </p>
              <p className="flex justify-between mt-2">
                <span>Shared on:</span>
                <span className="font-medium">{formatDate(fileData.created_at)}</span>
              </p>
            </div>
          </div>
          
          <Button 
            className="w-full gap-2" 
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
          
          <p className="text-xs text-center text-gray-500 mt-4">
            This file will be available for download until {formatDate(fileData.expires_at)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharePage;
