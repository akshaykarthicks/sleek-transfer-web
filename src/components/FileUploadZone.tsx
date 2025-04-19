import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Link as LinkIcon, ArrowRight, Copy } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { useNavigate } from "react-router-dom";

export const FileUploadZone = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    setShareLink(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB limit
  });

  const handleShare = async () => {
    if (!files.length) return;
    
    if (!user) {
      toast.error("You need to log in to share files");
      navigate("/auth");
      return;
    }
    
    setIsUploading(true);
    
    try {
      const file = files[0];
      const shareId = nanoid(10);
      const shareLink = `${window.location.origin}/share/${shareId}`;
      
      const fileExt = file.name.split('.').pop() || '';
      const uniqueFilename = `${Date.now()}_${shareId}.${fileExt}`;
      const filePath = `public/${uniqueFilename}`;
      
      const { error: uploadError } = await supabase.storage
        .from('shared_files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('shared_files')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('file_shares')
        .insert({
          file_name: file.name,
          file_size: file.size,
          share_link: shareLink,
          user_id: user.id,
          file_path: filePath,
          file_url: publicUrl
        });

      if (dbError) throw dbError;

      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setProgress(i);
      }

      setShareLink(shareLink);
      toast.success("File shared successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to share file");
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const copyToClipboard = async () => {
    if (!shareLink) return;
    
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`w-full p-12 border-2 border-dashed rounded-xl transition-all duration-200 
          ${isDragActive 
            ? "border-primary bg-primary/5" 
            : "border-gray-200 hover:border-primary/50"
          }
          cursor-pointer flex flex-col items-center justify-center gap-4
          ${isUploading ? "pointer-events-none opacity-50" : ""}`}
      >
        <input {...getInputProps()} />
        <Upload size={48} className={`${isDragActive ? "text-primary" : "text-gray-400"} transition-colors`} />
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">
            {isDragActive ? "Drop your files here" : "Drag & drop your files here"}
          </h3>
          <p className="text-sm text-gray-500">
            or click to select files (up to 2GB)
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="w-full space-y-6 animate-fade-in">
          <div className="bg-white/50 backdrop-blur-sm p-4 rounded-lg shadow-sm">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Upload size={16} />
              Selected Files ({totalSizeMB} MB):
            </h4>
            {files.map((file, index) => (
              <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-primary/10" />
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            ))}
          </div>

          {isUploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-gray-500">
                Uploading file... {progress}%
              </p>
            </div>
          )}

          {shareLink ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-white/50 backdrop-blur-sm rounded-lg">
                <LinkIcon size={16} className="text-gray-500" />
                <p className="text-sm text-gray-600 flex-1 truncate">{shareLink}</p>
                <Button size="sm" variant="outline" onClick={copyToClipboard}>
                  <Copy size={16} />
                </Button>
              </div>
              <Button 
                className="w-full"
                onClick={() => {
                  setFiles([]);
                  setShareLink(null);
                }}
              >
                Share Another File
              </Button>
            </div>
          ) : (
            <Button 
              className="w-full group"
              onClick={handleShare}
              disabled={isUploading || !files.length}
            >
              Generate Share Link
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
