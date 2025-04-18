
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Mail, ArrowRight, MessageSquare } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Progress } from "./ui/progress";

export const FileUploadZone = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [senderEmail, setSenderEmail] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB limit
  });

  const handleTransfer = async () => {
    if (!files.length || !senderEmail || !recipientEmail) return;
    
    setIsUploading(true);
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(i);
    }
    setIsUploading(false);
    // Reset form after successful upload
    setFiles([]);
    setSenderEmail("");
    setRecipientEmail("");
    setMessage("");
    setProgress(0);
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
            {isDragActive
              ? "Drop your files here"
              : "Drag & drop your files here"}
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

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Mail size={20} className="text-gray-400" />
              <div className="flex-1 space-y-3">
                <Input
                  type="email"
                  placeholder="Your email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="bg-white/50"
                />
                <Input
                  type="email"
                  placeholder="Recipient's email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="bg-white/50"
                />
              </div>
            </div>

            <div className="flex items-start gap-4">
              <MessageSquare size={20} className="text-gray-400 mt-2" />
              <Textarea
                placeholder="Add a message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-white/50 resize-none"
                rows={3}
              />
            </div>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-gray-500">
                Uploading... {progress}%
              </p>
            </div>
          )}

          <Button 
            className="w-full group"
            onClick={handleTransfer}
            disabled={isUploading || !files.length || !senderEmail || !recipientEmail}
          >
            {isUploading ? "Uploading..." : "Transfer Files"}
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      )}
    </div>
  );
};
