import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bqqridjerujseolhfcie.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcXJpZGplcnVqc2VvbGhmY2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2OTY2MTUsImV4cCI6MjEwNjI3MjYxNX0.IMogHy4qcAU5BAK0MrHKgPdJ6obQMYYUwtaiZjDa1jw';

export const BUCKET_NAME = import.meta.env.VITE_STORAGE_BUCKET || 'Files';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper to upload a file to the 'Files' storage bucket
 * @param file File to upload
 * @param folder Optional subfolder path (e.g., 'products', 'receipts')
 * @returns Public URL of the uploaded file or null on failure
 */
export async function uploadFileToBucket(file: File, folder: string = 'general'): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Storage Upload Error:', error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('File upload exception:', err);
    return null;
  }
}
