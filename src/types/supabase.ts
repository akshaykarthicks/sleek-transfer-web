
// Custom type definitions for Supabase tables
export type FileShare = {
  id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  file_path: string | null;
  file_url: string | null;
  share_link: string;
  created_at: string;
  expires_at: string;
}

export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
}
