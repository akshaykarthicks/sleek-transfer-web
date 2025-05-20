
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FileIcon, Download, Users, Database } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

type StatPeriod = "daily" | "weekly" | "monthly";
type TimeRange = { start: Date; end: Date };

const DashboardStats = () => {
  const [uploadStats, setUploadStats] = useState<any[]>([]);
  const [downloadStats, setDownloadStats] = useState<any[]>([]);
  const [totalUploads, setTotalUploads] = useState(0);
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalBandwidth, setTotalBandwidth] = useState(0);
  const [period, setPeriod] = useState<StatPeriod>("weekly");
  const [loading, setLoading] = useState(true);

  const getTimeRange = (period: StatPeriod): TimeRange => {
    const end = new Date();
    const start = new Date();
    
    if (period === "daily") {
      start.setDate(start.getDate() - 7); // Last 7 days
    } else if (period === "weekly") {
      start.setDate(start.getDate() - 28); // Last 4 weeks
    } else {
      start.setMonth(start.getMonth() - 6); // Last 6 months
    }
    
    return { start, end };
  };

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const range = getTimeRange(period);
        
        // Fetch upload stats
        const { data: uploads, error: uploadsError } = await (supabase
          .from('file_shares') as any)
          .select('*')
          .gte('created_at', range.start.toISOString())
          .lte('created_at', range.end.toISOString());
          
        if (uploadsError) throw uploadsError;
        
        // Fetch download stats
        const { data: downloads, error: downloadsError } = await (supabase
          .from('file_downloads') as any)
          .select('*')
          .gte('downloaded_at', range.start.toISOString())
          .lte('downloaded_at', range.end.toISOString());
          
        if (downloadsError) throw downloadsError;
        
        // Count active users (users who have uploaded or downloaded in the period)
        const activeUserIds = new Set();
        uploads.forEach((upload: any) => activeUserIds.add(upload.user_id));
        downloads.forEach((download: any) => {
          if (download.user_id) activeUserIds.add(download.user_id);
        });
        
        // Calculate total bandwidth (sum of file sizes)
        const bandwidth = uploads.reduce((sum: number, upload: any) => sum + upload.file_size, 0);
        
        setTotalUploads(uploads.length);
        setTotalDownloads(downloads.length);
        setActiveUsers(activeUserIds.size);
        setTotalBandwidth(bandwidth);
        
        // Prepare data for charts
        const uploadData = processTimeSeriesData(uploads, 'created_at', period);
        const downloadData = processTimeSeriesData(downloads, 'downloaded_at', period);
        
        setUploadStats(uploadData);
        setDownloadStats(downloadData);
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatistics();
  }, [period]);
  
  const processTimeSeriesData = (data: any[], dateField: string, period: StatPeriod) => {
    const result: any[] = [];
    const dateFormat = new Intl.DateTimeFormat('en-US', 
      period === "daily" ? { month: 'short', day: 'numeric' } : 
      period === "weekly" ? { month: 'short', day: 'numeric' } : 
      { month: 'short', year: 'numeric' }
    );
    
    const dateMap = new Map();
    
    data.forEach(item => {
      const date = new Date(item[dateField]);
      let key;
      
      if (period === "daily") {
        key = dateFormat.format(date);
      } else if (period === "weekly") {
        // Group by weeks
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `Week of ${dateFormat.format(weekStart)}`;
      } else {
        // Group by months
        key = dateFormat.format(date);
      }
      
      const count = (dateMap.get(key) || 0) + 1;
      dateMap.set(key, count);
    });
    
    dateMap.forEach((count, date) => {
      result.push({ date, count });
    });
    
    // Sort by date
    result.sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    return result;
  };
  
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 justify-between">
        <h2 className="text-2xl font-bold">Platform Statistics</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setPeriod("daily")} 
            className={`px-4 py-2 rounded-lg ${period === "daily" ? 'bg-white/20' : 'bg-white/5'}`}
          >
            Daily
          </button>
          <button 
            onClick={() => setPeriod("weekly")} 
            className={`px-4 py-2 rounded-lg ${period === "weekly" ? 'bg-white/20' : 'bg-white/5'}`}
          >
            Weekly
          </button>
          <button 
            onClick={() => setPeriod("monthly")} 
            className={`px-4 py-2 rounded-lg ${period === "monthly" ? 'bg-white/20' : 'bg-white/5'}`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-black/50 backdrop-blur-xl border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileIcon className="w-5 h-5" />
              Total Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalUploads}</div>
            <p className="text-sm text-white/70">Files shared</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black/50 backdrop-blur-xl border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="w-5 h-5" />
              Total Downloads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalDownloads}</div>
            <p className="text-sm text-white/70">Files downloaded</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black/50 backdrop-blur-xl border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeUsers}</div>
            <p className="text-sm text-white/70">Unique users</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black/50 backdrop-blur-xl border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5" />
              Total Bandwidth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatBytes(totalBandwidth)}</div>
            <p className="text-sm text-white/70">Data transferred</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-black/50 backdrop-blur-xl border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle>Upload Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
              </div>
            ) : (
              <ChartContainer
                config={{
                  uploads: {
                    label: "Uploads",
                    theme: {
                      light: "#4f46e5",
                      dark: "#4f46e5",
                    },
                  },
                }}
                className="aspect-auto h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={uploadStats}
                    margin={{ top: 20, right: 30, left: 20, bottom: 65 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#aaa' }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fill: '#aaa' }} />
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-black/90 border border-white/20 p-2 rounded">
                              <p className="text-white">{`${payload[0].payload.date}`}</p>
                              <p className="text-white">{`Uploads: ${payload[0].value}`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" name="uploads" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-black/50 backdrop-blur-xl border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle>Download Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
              </div>
            ) : (
              <ChartContainer
                config={{
                  downloads: {
                    label: "Downloads",
                    theme: {
                      light: "#22c55e",
                      dark: "#22c55e",
                    },
                  },
                }}
                className="aspect-auto h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={downloadStats}
                    margin={{ top: 20, right: 30, left: 20, bottom: 65 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#aaa' }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fill: '#aaa' }} />
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-black/90 border border-white/20 p-2 rounded">
                              <p className="text-white">{`${payload[0].payload.date}`}</p>
                              <p className="text-white">{`Downloads: ${payload[0].value}`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" name="downloads" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats;
