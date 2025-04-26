
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';

const AuthButton = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    // Check initial session
    const checkUser = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          toast.error("Authentication error");
        }
        
        setUser(session?.user || null);
      } catch (err) {
        console.error("Auth error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || "Failed to log out");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Button variant="outline" disabled>
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></span>
        Loading...
      </Button>
    );
  }

  return (
    <div>
      {user ? (
        <div className="flex items-center space-x-4 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full shadow-md">
          <span className="text-sm text-gray-700 font-medium truncate max-w-[150px]">{user.email}</span>
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            className="shadow-sm hover:shadow-md transition-all"
          >
            Log Out
          </Button>
        </div>
      ) : (
        <Link to="/auth">
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md hover:shadow-lg transition-all">
            Log In / Sign Up
          </Button>
        </Link>
      )}
    </div>
  );
};

export default AuthButton;
