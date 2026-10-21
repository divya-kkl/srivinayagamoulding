import { supabase } from '../supabaseClient';

const normalizeRate = (row) => ({
  id: row.id,
  dbId: row.id,
  date: row.date,
  name: row.name,
  gram: row.gram,
  amount: row.amount,
  type: row.type || '',
  isCurrent: row.is_current || false,
  gst: row.gst || 3,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export async function getRatesFromSupabase() {
  try {
    let { data, error } = await supabase
      .from('daily_rates')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return { data: data.map(normalizeRate) };
  } catch (error) {
    console.error("Error fetching rates:", error.message);
    return { error: error.message };
  }
}

export async function createRateInSupabase(rate) {
  try {
    const insertPayload = {
      date: rate.date,
      name: rate.name,
      gram: parseFloat(rate.gram) || 1,
      amount: parseFloat(rate.amount) || 0,
      type: rate.type || '',
      is_current: rate.isCurrent || false,
      gst: parseFloat(rate.gst) || 3
    };

    const { data, error } = await supabase
      .from('daily_rates')
      .insert([insertPayload])
      .select();

    if (error) throw error;
    return { data: normalizeRate(data[0]) };
  } catch (error) {
    console.error("Error creating rate:", error.message);
    return { error: error.message };
  }
}

export async function updateRateInSupabase(id, updates) {
  try {
    const updatePayload = {};
    if (updates.date !== undefined) updatePayload.date = updates.date;
    if (updates.name !== undefined) updatePayload.name = updates.name;
    if (updates.gram !== undefined) updatePayload.gram = parseFloat(updates.gram) || 1;
    if (updates.amount !== undefined) updatePayload.amount = parseFloat(updates.amount) || 0;
    if (updates.type !== undefined) updatePayload.type = updates.type;
    if (updates.isCurrent !== undefined) updatePayload.is_current = updates.isCurrent;
    if (updates.gst !== undefined) updatePayload.gst = parseFloat(updates.gst) || 3;
    
    updatePayload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('daily_rates')
      .update(updatePayload)
      .eq('id', id)
      .select();

    if (error) throw error;
    return { data: normalizeRate(data[0]) };
  } catch (error) {
    console.error("Error updating rate:", error.message);
    return { error: error.message };
  }
}

export async function deleteRateFromSupabase(id) {
  try {
    const { error } = await supabase
      .from('daily_rates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error deleting rate:", error.message);
    return { error: error.message };
  }
}
