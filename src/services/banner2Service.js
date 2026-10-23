import { supabase } from '../supabaseClient';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=1600&q=80';

const normalizeBanner2 = (row) => ({
  id: row.id,
  dbId: row.id,
  image: row.image_url || FALLBACK_IMAGE,
  status: row.status ? row.status.toUpperCase() : 'ACTIVE',
  createdAt: row.created_at
});

export async function getBanner2FromSupabase(activeOnly = false) {
  try {
    const { data, error } = await supabase
      .from('banner_2')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch banner_2 error:', error.message);
      return { 
        data: null, 
        error: error.message, 
        tableMissing: error.code === '42P01' || error.message?.includes('does not exist') 
      };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null, isEmpty: true };
    }

    const mapped = data.map(normalizeBanner2);
    const result = activeOnly
      ? mapped.filter(b => !b.status || b.status.toUpperCase() === 'ACTIVE')
      : mapped;

    return { data: result, error: null };
  } catch (err) {
    console.error('Error fetching banner_2 from Supabase:', err);
    return { data: null, error: err.message || 'Unknown network error' };
  }
}

export async function createBanner2InSupabase(banner) {
  try {
    const insertPayload = {
      image_url: banner.image || FALLBACK_IMAGE,
      status: banner.status ? banner.status.toUpperCase() : 'ACTIVE'
    };

    const { data, error } = await supabase
      .from('banner_2')
      .insert([insertPayload])
      .select();

    if (error) throw error;
    return { success: true, data: data ? normalizeBanner2(data[0]) : null };
  } catch (err) {
    console.error('Error creating banner_2:', err);
    return { success: false, error: err.message };
  }
}

export async function updateBanner2InSupabase(dbId, updates) {
  try {
    const updatePayload = {
      image_url: updates.image,
      status: updates.status ? updates.status.toUpperCase() : 'ACTIVE'
    };

    const { data, error } = await supabase
      .from('banner_2')
      .update(updatePayload)
      .eq('id', dbId)
      .select();

    if (error) throw error;
    return { success: true, data: data ? normalizeBanner2(data[0]) : null };
  } catch (err) {
    console.error('Error updating banner_2:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteBanner2FromSupabase(dbId) {
  try {
    const { error } = await supabase
      .from('banner_2')
      .delete()
      .eq('id', dbId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Error deleting banner_2 from Supabase:', err);
    return { success: false, error: err.message };
  }
}

export async function uploadBanner2ImageToSupabase(file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `banner2-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('banners')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('banners')
      .getPublicUrl(filePath);

    return { success: true, url: data.publicUrl };
  } catch (err) {
    console.error('Error uploading banner_2 image:', err);
    return { success: false, error: err.message };
  }
}
