
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

export type FileDownload = {
  id: string;
  file_share_id: string;
  user_id: string | null;
  ip_address: string | null;
  downloaded_at: string;
}

export type UserActivity = {
  id: string;
  user_id: string | null;
  activity_type: string;
  file_id: string | null;
  ip_address: string | null;
  created_at: string;
  metadata: any | null;
}

export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  is_admin: boolean | null;
  notification_access: boolean | null;
  notification_expiry: boolean | null;
}
