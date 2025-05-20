
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import { Profile } from "@/types/supabase";

const NotificationSettings = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await (supabase
        .from('profiles') as any)
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setProfiles(data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateNotificationSettings = async (userId: string, field: string, value: boolean) => {
    try {
      setSaving(true);
      
      // Update the local state first for immediate feedback
      setProfiles(profiles.map(profile => 
        profile.id === userId 
          ? { ...profile, [field]: value } 
          : profile
      ));
      
      // Then update in the database
      const { error } = await (supabase
        .from('profiles') as any)
        .update({ [field]: value })
        .eq('id', userId);
        
      if (error) throw error;
      
      toast.success("Notification settings updated");
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast.error("Failed to update notification settings");
      // Revert the local state change on error
      fetchProfiles();
    } finally {
      setSaving(false);
    }
  };
  
  const setAllNotifications = async (value: boolean) => {
    try {
      setSaving(true);
      
      // Update all profiles in the local state
      setProfiles(profiles.map(profile => ({
        ...profile,
        notification_access: value,
        notification_expiry: value
      })));
      
      // Update in the database
      const { error } = await (supabase
        .from('profiles') as any)
        .update({ 
          notification_access: value,
          notification_expiry: value
        });
        
      if (error) throw error;
      
      toast.success(`All notifications ${value ? 'enabled' : 'disabled'} for all users`);
    } catch (error) {
      console.error("Error updating all notification settings:", error);
      toast.error("Failed to update notification settings");
      // Revert the local state change on error
      fetchProfiles();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Notification Settings</h2>
      
      <Card className="bg-black/50 backdrop-blur-xl border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Configure which email notifications users receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Global Settings</h3>
              <p className="text-sm text-white/70">Quickly enable or disable all notifications</p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setAllNotifications(true)}
                disabled={saving}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/10"
              >
                Enable All
              </Button>
              <Button
                onClick={() => setAllNotifications(false)}
                disabled={saving}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/10"
              >
                Disable All
              </Button>
            </div>
          </div>
          
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
            </div>
          ) : profiles.length > 0 ? (
            <div className="overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead>User</TableHead>
                    <TableHead className="text-center">File Access Notifications</TableHead>
                    <TableHead className="text-center">Expiry Notifications</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <div>
                          <div className="font-medium">{profile.full_name || 'Unknown'}</div>
                          <div className="text-sm text-white/70">{profile.username || 'No username'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={profile.notification_access || false}
                            onCheckedChange={(checked) => updateNotificationSettings(profile.id, 'notification_access', checked)}
                            disabled={saving}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={profile.notification_expiry || false}
                            onCheckedChange={(checked) => updateNotificationSettings(profile.id, 'notification_expiry', checked)}
                            disabled={saving}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-white/70">No user profiles found</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="bg-black/50 backdrop-blur-xl border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle>Notification Templates</CardTitle>
          <CardDescription>
            Information about the email templates used for notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">File Access Notification</h3>
              <p className="text-sm text-white/70 mb-4">
                Sent to users when someone downloads or views their shared file.
              </p>
              <div className="text-xs bg-white/10 p-3 rounded-md font-mono">
                Subject: Your shared file has been accessed<br /><br />
                Body: Hello {`{username}`},<br />
                Your file "{`{filename}`}" was accessed on {`{access_date}`}.<br />
                IP Address: {`{ip_address}`}<br /><br />
                You can manage your notification preferences in your account settings.
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Expiry Notification</h3>
              <p className="text-sm text-white/70 mb-4">
                Sent to users 24 hours before their shared file expires.
              </p>
              <div className="text-xs bg-white/10 p-3 rounded-md font-mono">
                Subject: Your shared file is about to expire<br /><br />
                Body: Hello {`{username}`},<br />
                Your file "{`{filename}`}" will expire in 24 hours on {`{expiry_date}`}.<br />
                If you need to keep this file available, please re-upload it.<br /><br />
                You can manage your notification preferences in your account settings.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;
