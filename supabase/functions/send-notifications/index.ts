
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Create a Supabase client for the function
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// This is a scheduled function that will:
// 1. Send access notifications for new downloads
// 2. Send expiry warnings for files expiring in the next 24 hours

serve(async (req) => {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Process access notifications
    await processAccessNotifications();
    
    // Process expiry notifications
    await processExpiryNotifications();

    return new Response(
      JSON.stringify({ message: 'Notifications processed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error processing notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});

async function processAccessNotifications() {
  // Get recent file downloads that haven't had notifications sent yet
  // In a real implementation, you'd track which downloads have had notifications sent
  const { data: downloads, error: downloadsError } = await supabaseAdmin
    .from('file_downloads')
    .select(`
      id,
      file_share_id,
      user_id,
      ip_address,
      downloaded_at,
      file_shares (
        id, 
        user_id,
        file_name
      )
    `)
    .order('downloaded_at', { ascending: false })
    .limit(50);

  if (downloadsError) {
    throw downloadsError;
  }

  // Group downloads by file owner
  const notificationsByOwner = {};
  
  for (const download of downloads) {
    const fileOwner = download.file_shares?.user_id;
    if (!fileOwner) continue;
    
    // Skip if downloader is the same as the file owner
    if (download.user_id === fileOwner) continue;
    
    if (!notificationsByOwner[fileOwner]) {
      notificationsByOwner[fileOwner] = [];
    }
    
    notificationsByOwner[fileOwner].push({
      downloadId: download.id,
      fileName: download.file_shares.file_name,
      fileId: download.file_share_id,
      downloadedAt: download.downloaded_at,
      ipAddress: download.ip_address || 'Unknown'
    });
  }

  // Get owner profiles with notification preferences enabled
  for (const ownerId of Object.keys(notificationsByOwner)) {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', ownerId)
      .single();

    if (profileError) {
      console.error(`Error fetching profile for ${ownerId}:`, profileError);
      continue;
    }

    // Skip if user has disabled access notifications
    if (!profile.notification_access) continue;

    // In a real implementation, you would send actual emails
    console.log(`Would send access notification email to ${profile.username || profile.id} for downloads:`, notificationsByOwner[ownerId]);
    
    // Log as an activity
    const downloadsList = notificationsByOwner[ownerId];
    for (const download of downloadsList) {
      await supabaseAdmin
        .from('user_activities')
        .insert({
          activity_type: 'access_notification',
          user_id: ownerId,
          file_id: download.fileId,
          metadata: {
            download_id: download.downloadId,
            downloaded_at: download.downloadedAt
          }
        });
    }
  }
}

async function processExpiryNotifications() {
  // Get files expiring in the next 24 hours
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const twentyFourHoursLater = new Date();
  twentyFourHoursLater.setHours(twentyFourHoursLater.getHours() + 24);
  
  const { data: expiringFiles, error: expiringFilesError } = await supabaseAdmin
    .from('file_shares')
    .select(`
      id,
      user_id,
      file_name,
      expires_at
    `)
    .gte('expires_at', new Date().toISOString())
    .lte('expires_at', twentyFourHoursLater.toISOString());

  if (expiringFilesError) {
    throw expiringFilesError;
  }

  // Group files by owner
  const notificationsByOwner = {};
  
  for (const file of expiringFiles) {
    if (!notificationsByOwner[file.user_id]) {
      notificationsByOwner[file.user_id] = [];
    }
    
    notificationsByOwner[file.user_id].push({
      fileId: file.id,
      fileName: file.file_name,
      expiresAt: file.expires_at
    });
  }

  // Get owner profiles with notification preferences enabled
  for (const ownerId of Object.keys(notificationsByOwner)) {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', ownerId)
      .single();

    if (profileError) {
      console.error(`Error fetching profile for ${ownerId}:`, profileError);
      continue;
    }

    // Skip if user has disabled expiry notifications
    if (!profile.notification_expiry) continue;

    // In a real implementation, you would send actual emails
    console.log(`Would send expiry notification email to ${profile.username || profile.id} for files:`, notificationsByOwner[ownerId]);
    
    // Log as an activity
    const filesList = notificationsByOwner[ownerId];
    for (const file of filesList) {
      await supabaseAdmin
        .from('user_activities')
        .insert({
          activity_type: 'expiry_notification',
          user_id: ownerId,
          file_id: file.fileId,
          metadata: {
            expires_at: file.expiresAt
          }
        });
    }
  }
}
