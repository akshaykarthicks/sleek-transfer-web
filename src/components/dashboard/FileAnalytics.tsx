
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { FileShare } from "@/types/supabase";

type FileTypeData = {
  name: string;
  value: number;
  count: number;
};

const FileAnalytics = () => {
  const [fileTypes, setFileTypes] = useState<FileTypeData[]>([]);
  const [averageSize, setAverageSize] = useState<number>(0);
  const [largestFiles, setLargestFiles] = useState<FileShare[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const COLORS = ['#4f46e5', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

  useEffect(() => {
    const fetchFileAnalytics = async () => {
      try {
        setLoading(true);
        
        // Fetch all files
        const { data: files, error } = await (supabase
          .from('file_shares') as any)
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (files && files.length > 0) {
          // Calculate average file size
          const totalSize = files.reduce((sum: number, file: FileShare) => sum + file.file_size, 0);
          const avg = totalSize / files.length;
          setAverageSize(avg);
          
          // Group by file types
          const typeMap = new Map<string, { size: number; count: number }>();
          
          files.forEach((file: FileShare) => {
            const extension = file.file_name.split('.').pop()?.toLowerCase() || 'unknown';
            const fileType = getFileTypeCategory(extension);
            
            if (!typeMap.has(fileType)) {
              typeMap.set(fileType, { size: 0, count: 0 });
            }
            
            const current = typeMap.get(fileType)!;
            typeMap.set(fileType, {
              size: current.size + file.file_size,
              count: current.count + 1
            });
          });
          
          const typeData: FileTypeData[] = [];
          typeMap.forEach((data, type) => {
            typeData.push({
              name: type,
              value: data.size,
              count: data.count
            });
          });
          
          setFileTypes(typeData);
          
          // Get top 10 largest files
          const sortedFiles = [...files].sort((a, b) => b.file_size - a.file_size);
          setLargestFiles(sortedFiles.slice(0, 10));
        }
      } catch (error) {
        console.error("Error fetching file analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFileAnalytics();
  }, []);
  
  const getFileTypeCategory = (extension: string): string => {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'tiff'];
    const documentTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt'];
    const videoTypes = ['mp4', 'mov', 'avi', 'wmv', 'mkv', 'webm'];
    const audioTypes = ['mp3', 'wav', 'ogg', 'aac', 'm4a'];
    const archiveTypes = ['zip', 'rar', '7z', 'tar', 'gz'];
    const codeTypes = ['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'php', 'py', 'java', 'cpp', 'c', 'cs'];
    
    if (imageTypes.includes(extension)) return 'Images';
    if (documentTypes.includes(extension)) return 'Documents';
    if (videoTypes.includes(extension)) return 'Videos';
    if (audioTypes.includes(extension)) return 'Audio';
    if (archiveTypes.includes(extension)) return 'Archives';
    if (codeTypes.includes(extension)) return 'Code';
    
    return 'Other';
  };
  
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">File Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-black/50 backdrop-blur-xl border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle>File Types Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
              </div>
            ) : fileTypes.length > 0 ? (
              <ChartContainer config={{}} className="aspect-auto h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fileTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {fileTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as FileTypeData;
                          return (
                            <div className="bg-black/90 border border-white/20 p-3 rounded">
                              <p className="text-white font-medium">{data.name}</p>
                              <p className="text-white/70">Count: {data.count}</p>
                              <p className="text-white/70">Size: {formatBytes(data.value)}</p>
                              <p className="text-white/70">Percentage: {((data.value / fileTypes.reduce((sum, type) => sum + type.value, 0)) * 100).toFixed(1)}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-white/70">No file data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-black/50 backdrop-blur-xl border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle>Average File Size</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  {formatBytes(averageSize)}
                </div>
                <p className="text-white/70 text-center">Average size per file across the platform</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-black/50 backdrop-blur-xl border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle>Top 10 Largest Files</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
            </div>
          ) : largestFiles.length > 0 ? (
            <div className="overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead>File Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {largestFiles.map((file) => (
                    <TableRow key={file.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-medium">{file.file_name}</TableCell>
                      <TableCell>{formatBytes(file.file_size)}</TableCell>
                      <TableCell>{formatDate(file.created_at)}</TableCell>
                      <TableCell>{formatDate(file.expires_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-white/70">No file data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FileAnalytics;
