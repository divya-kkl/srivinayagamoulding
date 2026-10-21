import { supabase } from '../supabaseClient';

const normalizeTag = (row) => ({
  id: row.id,
  dbId: row.id,
  name: row.name,
  code: row.code || '',
  description: row.description || '',
  status: row.status ? row.status.toUpperCase() : 'ACTIVE',
  createdAt: row.created_at
});

export async function getTagsFromSupabase(activeOnly = false) {
  try {
    let query = supabase
      .from('tags')
      .select('*')
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('status', 'ACTIVE');
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase fetch tags error:', error.message);
      return { data: null, error: error.message };
    }

    return { 
      data: data ? data.map(normalizeTag) : [], 
      error: null 
    };
  } catch (err) {
    console.error('Error fetching tags:', err);
    return { data: null, error: err.message || 'Unknown network error' };
  }
}

export async function createTagInSupabase(tag) {
  try {
    const insertPayload = {
      name: tag.name.trim(),
      code: tag.code.trim(),
      description: tag.description || '',
      status: tag.status ? tag.status.toUpperCase() : 'ACTIVE'
    };

    const { data, error } = await supabase
      .from('tags')
      .insert([insertPayload])
      .select();

    if (error) throw error;
    return { success: true, data: data ? normalizeTag(data[0]) : null };
  } catch (err) {
    console.error('Error creating tag:', err);
    return { success: false, error: err.message };
  }
}

export async function updateTagInSupabase(dbId, updates) {
  try {
    const updatePayload = {};
    if (updates.name !== undefined) updatePayload.name = updates.name.trim();
    if (updates.code !== undefined) updatePayload.code = updates.code.trim();
    if (updates.description !== undefined) updatePayload.description = updates.description.trim();
    if (updates.status !== undefined) updatePayload.status = updates.status.toUpperCase();

    const { data, error } = await supabase
      .from('tags')
      .update(updatePayload)
      .eq('id', dbId)
      .select();

    if (error) throw error;
    return { success: true, data: data ? normalizeTag(data[0]) : null };
  } catch (err) {
    console.error('Error updating tag:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteTagInSupabase(dbId) {
  try {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', dbId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Error deleting tag:', err);
    return { success: false, error: err.message };
  }
}
