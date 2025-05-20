
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DashboardStats from "@/components/dashboard/DashboardStats";
import FileAnalytics from "@/components/dashboard/FileAnalytics";
import UserActivities from "@/components/dashboard/UserActivities";
import NotificationSettings from "@/components/dashboard/NotificationSettings";
import AdminControls from "@/components/dashboard/AdminControls";
import { Profile } from "@/types/supabase";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/auth");
          return;
        }
        
        setUser(user);
        
        // Get user profile to check admin status
        const { data: profileData, error: profileError } = await (supabase
          .from('profiles') as any)
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          throw profileError;
        }
        
        setProfile(profileData);
        
        // If not admin and trying to access dashboard, redirect
        if (!profileData?.is_admin) {
          toast.error("You don't have permission to access the admin dashboard");
          navigate("/");
          return;
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        toast.error("Authentication error");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-50" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="text-center relative z-10">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-white/70">Monitor your file sharing platform's performance and user activities</p>
        </header>

        <Tabs defaultValue="stats" className="space-y-6">
          <div className="sticky top-0 z-10 bg-black/70 backdrop-blur-sm py-2">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <TabsTrigger value="stats" className="data-[state=active]:bg-white/20">Statistics</TabsTrigger>
              <TabsTrigger value="files" className="data-[state=active]:bg-white/20">File Analytics</TabsTrigger>
              <TabsTrigger value="activities" className="data-[state=active]:bg-white/20">User Activities</TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-white/20">Notifications</TabsTrigger>
              <TabsTrigger value="admin" className="data-[state=active]:bg-white/20">Admin Controls</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="stats" className="space-y-6">
            <DashboardStats />
          </TabsContent>
          
          <TabsContent value="files" className="space-y-6">
            <FileAnalytics />
          </TabsContent>
          
          <TabsContent value="activities" className="space-y-6">
            <UserActivities />
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            <NotificationSettings />
          </TabsContent>
          
          <TabsContent value="admin" className="space-y-6">
            <AdminControls />
          </TabsContent>
        </Tabs>
      </div>
      
      <footer className="py-6 text-center text-sm text-white/60">
        <p>Admin Dashboard • © 2025 Akshay Karthick S</p>
      </footer>
    </div>
  );
};

export default Dashboard;
