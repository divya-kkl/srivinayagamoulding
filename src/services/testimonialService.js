import { supabase } from '../supabaseClient';

const normalizeTestimonial = (row) => ({
  id: row.id,
  dbId: row.id,
  name: row.name,
  location: row.location,
  review: row.review,
  rating: row.rating,
  image: row.image_url,
  verifiedBuyer: row.verified_buyer,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export async function getTestimonialsFromSupabase(activeOnly = false) {
  try {
    let query = supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    
    if (activeOnly) {
      query = query.eq('status', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { 
      data: data.map(normalizeTestimonial), 
      error: null 
    };
  } catch (err) {
    console.error('Error fetching testimonials:', err.message);
    return { data: null, error: err.message };
  }
}

export async function createTestimonialInSupabase(testimonialData) {
  try {
    const { data, error } = await supabase.from('testimonials').insert([{
      name: testimonialData.name,
      location: testimonialData.location,
      review: testimonialData.review,
      rating: testimonialData.rating || 5,
      image_url: testimonialData.image || null,
      verified_buyer: testimonialData.verifiedBuyer !== undefined ? testimonialData.verifiedBuyer : true,
      status: testimonialData.status !== undefined ? testimonialData.status : true,
    }]).select();

    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (err) {
    console.error('Error creating testimonial:', err.message);
    return { success: false, error: err.message };
  }
}

export async function updateTestimonialInSupabase(id, testimonialData) {
  try {
    const { data, error } = await supabase.from('testimonials').update({
      name: testimonialData.name,
      location: testimonialData.location,
      review: testimonialData.review,
      rating: testimonialData.rating,
      image_url: testimonialData.image,
      verified_buyer: testimonialData.verifiedBuyer,
      status: testimonialData.status,
      updated_at: new Date()
    }).eq('id', id).select();

    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (err) {
    console.error('Error updating testimonial:', err.message);
    return { success: false, error: err.message };
  }
}

export async function deleteTestimonialInSupabase(id) {
  try {
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Error deleting testimonial:', err.message);
    return { success: false, error: err.message };
  }
}

export async function uploadTestimonialImageToSupabase(file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `testimonial-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('testimonials')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('testimonials')
      .getPublicUrl(filePath);

    return { success: true, url: data.publicUrl };
  } catch (err) {
    console.error('Error uploading testimonial image:', err.message);
    return { success: false, error: err.message };
  }
}
