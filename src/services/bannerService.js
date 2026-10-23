import { supabase } from '../supabaseClient';

const FALLBACK_IMAGE = 'https://via.placeholder.com/1600x600?text=No+Banner+Image';

const normalizeBanner = (row) => ({
  id: row.id,
  dbId: row.id,
  image: row.image_url || FALLBACK_IMAGE,
  status: row.status ? row.status.toUpperCase() : 'ACTIVE',
  createdAt: row.created_at
});

export async function getBannersFromSupabase(activeOnly = false) {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch banners error:', error.message);
      return { data: null, error: error.message, tableMissing: error.code === '42P01' || error.message?.includes('does not exist') };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null, isEmpty: true };
    }

    const mapped = data.map(normalizeBanner);
    const result = activeOnly
      ? mapped.filter(b => !b.status || b.status.toUpperCase() === 'ACTIVE')
      : mapped;

    return { data: result, error: null };
  } catch (err) {
    console.error('Error fetching banners from Supabase:', err);
    return { data: null, error: err.message || 'Unknown network error' };
  }
}

export async function createBannerInSupabase(banner) {
  try {
    const insertPayload = {
      image_url: banner.image || FALLBACK_IMAGE,
      status: banner.status ? banner.status.toUpperCase() : 'ACTIVE'
    };

    const { data, error } = await supabase
      .from('banners')
      .insert([insertPayload])
      .select();

    if (error) throw error;
    return { success: true, data: data ? normalizeBanner(data[0]) : null };
  } catch (err) {
    console.error('Error creating banner:', err);
    return { success: false, error: err.message };
  }
}

export async function updateBannerInSupabase(dbId, updates) {
  try {
    const updatePayload = {};
    if (updates.image !== undefined) updatePayload.image_url = updates.image.trim();
    if (updates.status !== undefined) updatePayload.status = updates.status.toUpperCase();

    const { data, error } = await supabase
      .from('banners')
      .update(updatePayload)
      .eq('id', dbId)
      .select();

    if (error) throw error;
    return { success: true, data: data ? normalizeBanner(data[0]) : null };
  } catch (err) {
    console.error('Error updating banner:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteBannerInSupabase(dbId) {
  try {
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', dbId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Error deleting banner:', err);
    return { success: false, error: err.message };
  }
}

export async function uploadBannerImageToSupabase(file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `banner-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('banners')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('banners')
      .getPublicUrl(filePath);

    return { success: true, url: data.publicUrl };
  } catch (err) {
    console.error('Error uploading banner image:', err);
    return { success: false, error: err.message };
  }
}
