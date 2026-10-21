import { supabase } from '../supabaseClient';

export async function getSiteSettings() {
  try {
    const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single();
    if (error && error.code !== 'PGRST116') throw error; // Ignore not found error initially
    return { data, error: null };
  } catch (err) {
    console.error('Error fetching settings:', err.message);
    return { data: null, error: err.message };
  }
}

export async function updateSiteSettings(payload) {
  try {
    const { data, error } = await supabase.from('site_settings').upsert({
      id: 1,
      ...payload,
      updated_at: new Date()
    }).select();

    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (err) {
    console.error('Error updating settings:', err.message);
    return { success: false, error: err.message };
  }
}

export async function uploadLogoToSupabase(file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;


    const { error: uploadError } = await supabase.storage
      .from('settings')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('settings')
      .getPublicUrl(filePath);

    return { success: true, url: data.publicUrl };
  } catch (err) {
    console.error('Error uploading logo:', err.message);
    return { success: false, error: err.message };
  }
}
