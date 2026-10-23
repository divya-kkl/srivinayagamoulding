import { supabase } from '../supabaseClient';

const FALLBACK_IMAGE = 'https://via.placeholder.com/150?text=No+Image';

export const resolveImageUrl = (img) => {
  if (!img) return FALLBACK_IMAGE;
  if (img.startsWith('http') || img.startsWith('data:') || img.startsWith('/')) return img;
  return supabase.storage.from('products').getPublicUrl(img).data.publicUrl;
};

const normalizeProduct = (row) => {
  let imagesArray = [];
  try {
    const parsed = JSON.parse(row.image_url);
    if (Array.isArray(parsed)) {
      imagesArray = parsed;
    } else if (parsed && typeof parsed === 'string') {
      imagesArray = [parsed];
    } else {
      imagesArray = [row.image_url || FALLBACK_IMAGE];
    }
  } catch (e) {
    imagesArray = [row.image_url || FALLBACK_IMAGE];
  }

  imagesArray = imagesArray
    .filter(Boolean)
    .map(resolveImageUrl);

  if (imagesArray.length === 0) {
    imagesArray = [FALLBACK_IMAGE];
  }

  return {
    id: row.id,
    dbId: row.id,
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id,
    tagId: row.tag_id,
    productCode: row.product_code || '',
    name: row.name,
    description: row.description || '',
    image: imagesArray[0],
    images: imagesArray,
    grossWeight: row.gross_weight || '',
    netWeight: row.net_weight || '',
    makingCharge: row.making_charge_per_gram || '',
    makingChargePercent: row.making_charge_percent || '',
    purity: row.purity || '22K Gold',
    status: row.status ? row.status.toUpperCase() : 'ACTIVE',
    createdAt: row.created_at,
    categoryName: row.categories ? row.categories.name : 'Unknown',
    subcategoryName: row.subcategories ? row.subcategories.name : 'Unknown',
    tagName: row.tags ? row.tags.name : ''
  };
};

export async function getProductsFromSupabase(activeOnly = false) {
  try {
    let query = supabase
      .from('products')
      .select('*, categories(name), subcategories(name), tags(name)')
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('status', 'ACTIVE');
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase fetch products error:', error.message);
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null, isEmpty: true };
    }

    return {
      data: data.map(normalizeProduct),
      error: null
    };
  } catch (err) {
    console.error('Error fetching products:', err);
    return { data: null, error: err.message || 'Unknown network error' };
  }
}

export async function searchProductsInSupabase(searchQuery) {
  try {
    if (!searchQuery || !searchQuery.trim()) {
      return { data: [], error: null };
    }

    // Fetch active products from Supabase
    const { data, error } = await getProductsFromSupabase(true);
    if (error) {
      console.warn('Supabase search products error:', error);
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null, isEmpty: true };
    }

    // Filter primarily by product name and product code
    const matches = data.filter((item) => {
      const nameStr = String(item.name || '').toLowerCase().trim();
      const codeStr = String(item.productCode || '').toLowerCase().trim();

      return nameStr.includes(cleanQ) || codeStr.includes(cleanQ);
    });

    return {
      data: matches,
      error: null
    };
  } catch (err) {
    console.error('Error searching products:', err);
    return { data: null, error: err.message || 'Unknown network error' };
  }
}

export const prepareImageUrl = (images) => {
  if (!images || images.length === 0) return JSON.stringify([FALLBACK_IMAGE]);
  const arr = Array.isArray(images) ? images.filter(Boolean) : [images];
  if (arr.length === 0) return JSON.stringify([FALLBACK_IMAGE]);

  // Always compact Supabase storage URLs to filenames to save character space
  const compact = arr.map(img => {
    if (!img) return '';
    const str = String(img).trim();
    const match = str.match(/\/products\/([^?#]+)/);
    if (match) return match[1];
    try {
      const u = new URL(str);
      return u.origin + u.pathname;
    } catch (e) {
      return str;
    }
  });

  return JSON.stringify(compact);
};

export async function createProductInSupabase(product) {
  try {
    const rawImages = product.images && product.images.length > 0
      ? product.images
      : [product.image || FALLBACK_IMAGE];

    const insertPayload = {
      category_id: product.categoryId,
      subcategory_id: product.subcategoryId || null,
      tag_id: product.tagId || null,
      product_code: product.productCode || '',
      name: product.name.trim(),
      description: product.description || '',
      image_url: prepareImageUrl(rawImages),
      badge: product.badge || '',
      purity: product.purity || '22K Gold',
      gross_weight: parseFloat(product.grossWeight) || 0,
      net_weight: parseFloat(product.netWeight) || 0,
      making_charge_per_gram: parseFloat(product.makingCharge) || 0,
      making_charge_percent: parseFloat(product.makingChargePercent) || 0,
      status: product.status ? product.status.toUpperCase() : 'ACTIVE'
    };

    let { data, error } = await supabase
      .from('products')
      .insert([insertPayload])
      .select();

    if (error) throw error;
    return { success: true, data: data ? data[0] : null };
  } catch (err) {
    console.error('Error creating product:', err);
    return { success: false, error: err.message };
  }
}

export async function updateProductInSupabase(dbId, updates) {
  try {
    const updatePayload = {};
    if (updates.categoryId !== undefined) updatePayload.category_id = updates.categoryId;
    if (updates.subcategoryId !== undefined) updatePayload.subcategory_id = updates.subcategoryId || null;
    if (updates.tagId !== undefined) updatePayload.tag_id = updates.tagId || null;
    if (updates.productCode !== undefined) updatePayload.product_code = updates.productCode.trim();
    if (updates.name !== undefined) updatePayload.name = updates.name.trim();
    if (updates.description !== undefined) updatePayload.description = updates.description.trim();

    if (updates.images !== undefined) {
      updatePayload.image_url = prepareImageUrl(updates.images);
    } else if (updates.image !== undefined) {
      updatePayload.image_url = prepareImageUrl([updates.image.trim()]);
    }

    if (updates.badge !== undefined) updatePayload.badge = updates.badge.trim();
    if (updates.purity !== undefined) updatePayload.purity = updates.purity;
    if (updates.grossWeight !== undefined) updatePayload.gross_weight = parseFloat(updates.grossWeight) || 0;
    if (updates.netWeight !== undefined) updatePayload.net_weight = parseFloat(updates.netWeight) || 0;
    if (updates.makingCharge !== undefined) updatePayload.making_charge_per_gram = parseFloat(updates.makingCharge) || 0;
    if (updates.makingChargePercent !== undefined) updatePayload.making_charge_percent = parseFloat(updates.makingChargePercent) || 0;
    if (updates.status !== undefined) updatePayload.status = updates.status.toUpperCase();

    let { data, error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', dbId)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error("Update failed. 0 rows modified (Check Supabase RLS policies for UPDATE).");
    }
    return { success: true, data: data[0] };
  } catch (err) {
    console.error('Error updating product:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteProductInSupabase(dbId) {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', dbId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Error deleting product:', err);
    return { success: false, error: err.message };
  }
}

export async function uploadProductImageToSupabase(file) {
  try {
    const rawExt = file.name.split('.').pop() || 'jpg';
    const cleanExt = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileName = `p${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}.${cleanExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    return { success: true, url: data.publicUrl, fileName: filePath };
  } catch (err) {
    console.error('Error uploading product image:', err);
    return { success: false, error: err.message };
  }
}
