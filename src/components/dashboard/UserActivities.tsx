
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { FileIcon, Download, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserActivity } from "@/types/supabase";

const UserActivities = () => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: "",
    end: ""
  });
  
  useEffect(() => {
    fetchActivities();
  }, []);
  
  const fetchActivities = async (filters = {}) => {
    try {
      setLoading(true);
      
      let query = (supabase
        .from('user_activities') as any)
        .select(`
          *,
          profiles:user_id (username, full_name),
          file_shares:file_id (file_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      // Apply filters if provided
      if (filters) {
        const { userId, fileId, startDate, endDate } = filters as any;
        
        if (userId) {
          query = query.eq('user_id', userId);
        }
        
        if (fileId) {
          query = query.eq('file_id', fileId);
        }
        
        if (startDate) {
          query = query.gte('created_at', startDate);
        }
        
        if (endDate) {
          query = query.lte('created_at', endDate);
        }
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = () => {
    const filters: any = {};
    
    // Only add date filters if they're provided
    if (dateRange.start) {
      filters.startDate = new Date(dateRange.start).toISOString();
    }
    
    if (dateRange.end) {
      filters.endDate = new Date(dateRange.end).toISOString();
    }
    
    fetchActivities(filters);
  };
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return <FileIcon className="w-5 h-5 text-blue-500" />;
      case 'download':
        return <Download className="w-5 h-5 text-green-500" />;
      case 'delete':
        return <Trash2 className="w-5 h-5 text-red-500" />;
      default:
        return <FileIcon className="w-5 h-5 text-gray-500" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const filteredActivities = activities.filter(activity => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const activityType = activity.activity_type.toLowerCase();
    const fileName = (activity as any).file_shares?.file_name?.toLowerCase() || '';
    const username = (activity as any).profiles?.username?.toLowerCase() || '';
    const fullName = (activity as any).profiles?.full_name?.toLowerCase() || '';
    const ipAddress = activity.ip_address?.toLowerCase() || '';
    
    return activityType.includes(searchLower) || 
           fileName.includes(searchLower) || 
           username.includes(searchLower) || 
           fullName.includes(searchLower) ||
           ipAddress.includes(searchLower);
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">User Activities</h2>
      
      <Card className="bg-black/50 backdrop-blur-xl border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle>Activity Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Search by user, file, or IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Input
                type="date"
                placeholder="Start date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Input
                type="date"
                placeholder="End date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button 
              onClick={handleSearch}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/10 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-black/50 backdrop-blur-xl border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
            </div>
          ) : filteredActivities.length > 0 ? (
            <div className="overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead className="w-[100px]">Activity</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map((activity) => (
                    <TableRow key={activity.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActivityIcon(activity.activity_type)}
                          <span className="capitalize">{activity.activity_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(activity as any).profiles?.full_name || (activity as any).profiles?.username || 'Anonymous'}
                      </TableCell>
                      <TableCell>
                        {(activity as any).file_shares?.file_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {activity.ip_address || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {formatDate(activity.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-white/70">No activities found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserActivities;
