
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, File, Trash2, UserX, Filter } from "lucide-react";
import { toast } from "sonner";
import { FileShare, Profile } from "@/types/supabase";

type UserData = Profile & {
  file_count?: number;
  total_size?: number;
};

const AdminControls = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [flaggedFiles, setFlaggedFiles] = useState<FileShare[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [fileSearch, setFileSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  useEffect(() => {
    fetchUsers();
    fetchFlaggedFiles();
  }, []);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get all users with file stats
      const { data: profiles, error: profilesError } = await (supabase
        .from('profiles') as any)
        .select('*')
        .order('created_at', { ascending: false });
        
      if (profilesError) throw profilesError;
      
      if (profiles && profiles.length > 0) {
        // For each user, get file count and total size
        const usersWithStats = await Promise.all(profiles.map(async (profile: Profile) => {
          const { data: files, error: filesError } = await (supabase
            .from('file_shares') as any)
            .select('file_size')
            .eq('user_id', profile.id);
            
          if (filesError) throw filesError;
          
          const file_count = files ? files.length : 0;
          const total_size = files ? files.reduce((sum: number, file: any) => sum + file.file_size, 0) : 0;
          
          return {
            ...profile,
            file_count,
            total_size
          };
        }));
        
        setUsers(usersWithStats);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchFlaggedFiles = async () => {
    try {
      setLoading(true);
      
      // Simulate fetching flagged files - in a real app, you might have a flagged field
      // For now, let's just get files larger than 10MB as an example
      const { data, error } = await (supabase
        .from('file_shares') as any)
        .select(`
          *,
          profiles:user_id (username, full_name)
        `)
        .gt('file_size', 10 * 1024 * 1024) // Files over 10MB
        .order('file_size', { ascending: false });
        
      if (error) throw error;
      
      setFlaggedFiles(data || []);
    } catch (error) {
      console.error("Error fetching flagged files:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const deleteFile = async (fileId: string) => {
    try {
      setActionLoading(true);
      
      // Delete file from storage (this would depend on your actual storage implementation)
      // This is just a placeholder for where you'd remove the actual file
      
      // Delete from database
      const { error } = await (supabase
        .from('file_shares') as any)
        .delete()
        .eq('id', fileId);
        
      if (error) throw error;
      
      // Update local state
      setFlaggedFiles(flaggedFiles.filter(file => file.id !== fileId));
      
      // Log activity
      await (supabase
        .from('user_activities') as any)
        .insert({
          activity_type: 'delete',
          file_id: fileId,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });
      
      toast.success("File deleted successfully");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    } finally {
      setActionLoading(false);
    }
  };
  
  const toggleAdminStatus = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      setActionLoading(true);
      
      // Update admin status
      const { error } = await (supabase
        .from('profiles') as any)
        .update({ is_admin: !isCurrentlyAdmin })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, is_admin: !isCurrentlyAdmin } 
          : user
      ));
      
      toast.success(`User ${isCurrentlyAdmin ? 'removed from' : 'added to'} admins`);
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast.error("Failed to update admin status");
    } finally {
      setActionLoading(false);
    }
  };
  
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const filteredUsers = users.filter(user => {
    if (!userSearch) return true;
    
    const searchLower = userSearch.toLowerCase();
    const username = (user.username || '').toLowerCase();
    const fullName = (user.full_name || '').toLowerCase();
    
    return username.includes(searchLower) || fullName.includes(searchLower);
  });
  
  const filteredFiles = flaggedFiles.filter(file => {
    if (!fileSearch) return true;
    
    const searchLower = fileSearch.toLowerCase();
    const fileName = file.file_name.toLowerCase();
    const username = ((file as any).profiles?.username || '').toLowerCase();
    const fullName = ((file as any).profiles?.full_name || '').toLowerCase();
    
    return fileName.includes(searchLower) || username.includes(searchLower) || fullName.includes(searchLower);
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Admin Controls</h2>
      
      <Card className="bg-black/50 backdrop-blur-xl border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage user accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="bg-white/10 border-white/20 text-white pl-10"
              />
            </div>
          </div>
          
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead>User</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Files</TableHead>
                    <TableHead>Storage Used</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {user.full_name || 'Unknown'}
                            {user.is_admin && (
                              <span className="bg-blue-900/60 text-blue-200 text-xs py-0.5 px-2 rounded-full">Admin</span>
                            )}
                          </div>
                          <div className="text-sm text-white/70">{user.username || 'No username'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell>
                        {user.file_count}
                      </TableCell>
                      <TableCell>
                        {formatBytes(user.total_size || 0)}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => toggleAdminStatus(user.id, !!user.is_admin)}
                          disabled={actionLoading}
                          size="sm"
                          variant="outline"
                          className={`
                            ${user.is_admin ? 'bg-red-500/10 hover:bg-red-500/20 text-red-300' : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-300'} 
                            border-none
                          `}
                        >
                          {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-white/70">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-black/50 backdrop-blur-xl border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-yellow-500" />
            Flagged Files
          </CardTitle>
          <CardDescription>
            Files that might need moderation (currently showing large files &gt; 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 h-4 w-4" />
              <Input
                placeholder="Search flagged files..."
                value={fileSearch}
                onChange={(e) => setFileSearch(e.target.value)}
                className="bg-white/10 border-white/20 text-white pl-10"
              />
            </div>
          </div>
          
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
            </div>
          ) : filteredFiles.length > 0 ? (
            <div className="overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead>File</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Uploaded On</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow key={file.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <File className="w-5 h-5 text-white/70" />
                          <span>{file.file_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatBytes(file.file_size)}
                      </TableCell>
                      <TableCell>
                        {(file as any).profiles?.full_name || (file as any).profiles?.username || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {formatDate(file.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => deleteFile(file.id)}
                          disabled={actionLoading}
                          size="sm"
                          variant="outline"
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-300 border-none"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-white/70">No flagged files found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminControls;
