import React, { useState, useEffect } from 'react';
import '../AdminPanel.css';
import { getProductsFromSupabase, createProductInSupabase, updateProductInSupabase, deleteProductInSupabase, uploadProductImageToSupabase } from '../../services/productService';
import { getCategoriesFromSupabase } from '../../services/categoryService';
import { getSubcategoriesFromSupabase } from '../../services/subcategoryService';
import { getTagsFromSupabase } from '../../services/tagService';
import { getRatesFromSupabase } from '../../services/rateService';
import ProductPriceCalculator, { calculateFinalPrice } from './ProductPriceCalculator';

const ProductPanel = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [liveRates, setLiveRates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const initialFormState = {
    categoryId: '', subcategoryId: '', tagId: '', productCode: '', name: '', description: '', image: '', images: [],
    badge: '', purity: '22K Gold', grossWeight: '', netWeight: '', makingCharge: '', mcType: 'flat', status: 'ACTIVE'
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const catRes = await getCategoriesFromSupabase(false);
    if (catRes.data) setCategories(catRes.data);

    const subcatRes = await getSubcategoriesFromSupabase(null, false);
    if (subcatRes.data) setSubcategories(subcatRes.data);

    const tagRes = await getTagsFromSupabase(false);
    if (tagRes.data) setTags(tagRes.data);

    const prodRes = await getProductsFromSupabase();
    if (prodRes.data) setProducts(prodRes.data);

    const rateRes = await getRatesFromSupabase();
    if (rateRes.data) setLiveRates(rateRes.data.filter(r => r.isCurrent));
    setIsLoading(false);
  };

  const buildTreeOptions = (items, parentSubId = null, depth = 0) => {
    const list = [];
    const filtered = items.filter(i => (i.subcategoryId || null) === parentSubId);

    for (const item of filtered) {
      list.push({
        ...item,
        label: `${'— '.repeat(depth)}${item.name} ${depth > 0 ? '(Child)' : ''}`
      });
      list.push(...buildTreeOptions(items, item.dbId, depth + 1));
    }
    return list;
  };

  const openForm = (product = null) => {
    if (product) {
      setEditingProduct(product);
      const hasPercent = parseFloat(product.makingChargePercent) > 0;
      setFormData({
        categoryId: product.categoryId || '',
        subcategoryId: product.subcategoryId || '',
        tagId: product.tagId || '',
        productCode: product.productCode || '',
        name: product.name,
        description: product.description,
        image: product.image,
        images: product.images || [product.image],
        badge: product.badge || '',
        purity: product.purity || '22K Gold',
        grossWeight: product.grossWeight || '',
        netWeight: product.netWeight || '',
        makingCharge: hasPercent ? product.makingChargePercent : (product.makingCharge || ''),
        mcType: hasPercent ? 'percent' : 'flat',
        status: product.status
      });
    } else {
      setEditingProduct(null);
      setFormData({ ...initialFormState, categoryId: categories.length > 0 ? categories[0].dbId : '' });
    }
    setImageFiles([]);
    setIsFormOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.categoryId) {
      alert("Please select a Category!");
      return;
    }

    setIsSaving(true);

    let finalImages = [...(formData.images || [])];

    if (imageFiles && imageFiles.length > 0) {
      for (const file of imageFiles) {
        const { success, url, error } = await uploadProductImageToSupabase(file);
        if (success) {
          finalImages.push(url);
        } else {
          alert("Image upload failed!\nError: " + error);
          setIsSaving(false);
          return;
        }
      }
    }

    finalImages = finalImages.filter(Boolean);

    if (finalImages.length === 0) {
      finalImages = [formData.image || '']; // fallback
    }

    const payload = {
      ...formData,
      image: finalImages[0],
      images: finalImages,
      makingCharge: formData.mcType === 'flat' ? formData.makingCharge : '',
      makingChargePercent: formData.mcType === 'percent' ? formData.makingCharge : ''
    };

    if (editingProduct) {
      const { success, error } = await updateProductInSupabase(editingProduct.dbId, payload);
      if (success) {
        loadData();
        setIsFormOpen(false);
      } else {
        alert("Error updating: " + error);
      }
    } else {
      const { success, error } = await createProductInSupabase(payload);
      if (success) {
        loadData();
        setIsFormOpen(false);
      } else {
        alert("Error creating: " + error);
      }
    }
    setIsSaving(false);
  };

  const handleDelete = async (dbId, name) => {
    if (window.confirm(`Delete product "${name}"?`)) {
      const { success } = await deleteProductInSupabase(dbId);
      if (success) loadData();
    }
  };

  const q = (searchQuery || '').trim().toLowerCase();
  const filteredProducts = products.filter(p => {
    if (!q) return true;
    const name = (p?.name || '').toLowerCase();
    const code = (p?.productCode || '').toLowerCase();
    const cat = (p?.categoryName || '').toLowerCase();
    const sub = (p?.subcategoryName || '').toLowerCase();
    const purity = (p?.purity || '').toLowerCase();
    const id = String(p?.id || '').toLowerCase();
    const dbId = String(p?.dbId || '').toLowerCase();
    return name.includes(q) || code.includes(q) || cat.includes(q) || sub.includes(q) || purity.includes(q) || id.includes(q) || dbId.includes(q);
  });

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (safeCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (safeCurrentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <>
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h3 style={{ margin: 0 }}>Products List</h3>
            {!isLoading && filteredProducts.length > 0 && (
              <div className="admin-pagination-info" style={{ marginTop: '5px', fontSize: '0.86rem' }}>
                Showing <span>{startIndex + 1}</span> to <span>{endIndex}</span> of <span>{totalItems}</span> products
              </div>
            )}
          </div>
          <div className="admin-controls">
            <input
              type="text"
              className="admin-search"
              placeholder="Search product name, code, category..."
              value={searchQuery || ''}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            <button className="admin-btn-primary" onClick={() => openForm()}>
              + Add Product
            </button>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Category</th>
                <th>Product Details</th>
                <th>Status</th>
                <th>Est. Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`shimmer-${idx}`}>
                    <td><div className="admin-shimmer" style={{ width: '60px', height: '60px' }}></div></td>
                    <td>
                      <div className="admin-shimmer" style={{ width: '80px', height: '15px', marginBottom: '4px' }}></div>
                      <div className="admin-shimmer" style={{ width: '60px', height: '12px' }}></div>
                    </td>
                    <td>
                      <div className="admin-shimmer" style={{ width: '150px', height: '15px', marginBottom: '4px' }}></div>
                      <div className="admin-shimmer" style={{ width: '200px', height: '12px' }}></div>
                    </td>
                    <td><div className="admin-shimmer" style={{ width: '60px', height: '24px', borderRadius: '12px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '60px', height: '15px' }}></div></td>
                    <td>
                      <div className="admin-shimmer" style={{ display: 'inline-block', width: '30px', height: '30px', marginRight: '5px' }}></div>
                      <div className="admin-shimmer" style={{ display: 'inline-block', width: '30px', height: '30px' }}></div>
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                    {searchQuery ? `No products found matching "${searchQuery}"` : 'No products found'}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((prod) => (
                  <tr key={prod.dbId}>
                    <td>
                      <img src={prod.image} alt={prod.name} className="list-img" style={{ height: '60px', width: '60px' }} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 'bold', color: '#444' }}>{prod.categoryName}</div>
                      {prod.subcategoryName !== 'Unknown' && <div style={{ fontSize: '0.8rem', color: '#888' }}>{prod.subcategoryName}</div>}
                    </td>
                    <td>
                      <div className="list-title" style={{ marginBottom: '4px' }}>
                        {prod.name}
                        {prod.productCode && <span style={{ marginLeft: '8px', color: '#888', fontSize: '0.8rem' }}>#{prod.productCode}</span>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        {prod.tagName && <span style={{ background: '#d4af37', color: '#000', padding: '2px 6px', borderRadius: '4px', marginRight: '5px', fontSize: '0.7rem', fontWeight: 'bold' }}>{prod.tagName}</span>}
                        {prod.badge && <span style={{ background: '#5e0b15', color: '#fff', padding: '2px 6px', borderRadius: '4px', marginRight: '5px', fontSize: '0.7rem' }}>{prod.badge}</span>}
                        {prod.purity && <span style={{ marginRight: '5px', color: '#b8860b' }}>{prod.purity}</span>}
                        {prod.netWeight > 0 && <span>| ⚖ {prod.netWeight}g</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${prod.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                        {prod.status}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#b36a00' }}>
                        ₹{calculateFinalPrice(prod, liveRates).finalPrice.toLocaleString('en-IN')}
                      </strong>
                    </td>
                    <td>
                      <button className="action-btn edit" onClick={() => openForm(prod)} title="Edit">✎</button>
                      <button className="action-btn delete" onClick={() => handleDelete(prod.dbId, prod.name)} title="Delete">🗑</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredProducts.length > 0 && (
          <div className="admin-pagination">
            <div className="admin-pagination-nav">
              <button
                type="button"
                className="page-btn nav-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                title="Previous Page"
              >
                ‹
              </button>

              {getPageNumbers().map((item, idx) =>
                item === '...' ? (
                  <span key={`dots-${idx}`} className="page-ellipsis">…</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={`page-btn ${safeCurrentPage === item ? 'active' : ''}`}
                    onClick={() => setCurrentPage(item)}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                type="button"
                className="page-btn nav-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                title="Next Page"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content" style={{ maxWidth: '800px' }}>
            <div className="admin-modal-header">
              <h3>{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
              <button className="close-modal-btn" onClick={() => setIsFormOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveProduct}>
              <div className="admin-modal-body pro-form-grid">

                <div className="pro-form-section">
                  <h4>Classification</h4>
                </div>

                <div className="pro-form-group">
                  <label>Category *</label>
                  <select required value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}>
                    <option value="" disabled>Select a Category...</option>
                    {categories.map(c => <option key={c.dbId} value={c.dbId}>{c.name}</option>)}
                  </select>
                </div>

                <div className="pro-form-group">
                  <label>Subcategory / Child (Optional)</label>
                  <select value={formData.subcategoryId} onChange={e => setFormData({ ...formData, subcategoryId: e.target.value })}>
                    <option value="">None (Under Category Only)</option>
                    {buildTreeOptions(subcategories.filter(s => s.categoryId === formData.categoryId)).map(s => (
                      <option key={s.dbId} value={s.dbId}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="pro-form-group full-width">
                  <label>Product Name *</label>
                  <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Antique Gold Floral Bridal Necklace" />
                </div>

                <div className="pro-form-group">
                  <label>Product Code</label>
                  <input value={formData.productCode} onChange={e => setFormData({ ...formData, productCode: e.target.value })} placeholder="e.g. NK-2034" />
                </div>

                <div className="pro-form-section">
                  <h4>Product Specifications</h4>
                </div>

                <div className="pro-form-group">
                  <label>Tag (Badge)</label>
                  <select value={formData.tagId} onChange={e => setFormData({ ...formData, tagId: e.target.value })}>
                    <option value="">No Tag</option>
                    {tags.map(t => (
                      <option key={t.dbId} value={t.dbId}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="pro-form-group">
                  <label>Custom Badge (Text)</label>
                  <input value={formData.badge} onChange={e => setFormData({ ...formData, badge: e.target.value })} placeholder="e.g. BRIDAL EXCLUSIVE" />
                </div>

                <div className="pro-form-section full-width" style={{ background: '#fffdf4', border: '1px solid #f2e3b6', borderRadius: '8px', padding: '20px', marginTop: '15px' }}>
                  <div style={{ borderBottom: '2px solid #e0b024', paddingBottom: '10px', marginBottom: '20px', display: 'inline-block' }}>
                    <h4 style={{ margin: 0, color: '#b36a00', fontSize: '1.1rem', fontWeight: 'bold' }}>⚖️ Jewellery Details (Weight & Metal Purity)</h4>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
                    <div className="pro-form-group">
                      <label style={{ color: '#8a4b00' }}>Gross Weight (g)</label>
                      <input type="number" step="0.01" value={formData.grossWeight} onChange={e => setFormData({ ...formData, grossWeight: e.target.value })} placeholder="e.g. 5.5" style={{ borderColor: '#e8c974', outlineColor: '#e0b024' }} />
                    </div>

                    <div className="pro-form-group">
                      <label style={{ color: '#8a4b00' }}>Net Weight (g)</label>
                      <input type="number" step="0.01" value={formData.netWeight} onChange={e => setFormData({ ...formData, netWeight: e.target.value })} placeholder="e.g. 4.8" style={{ borderColor: '#e8c974', outlineColor: '#e0b024' }} />
                    </div>

                    <div className="pro-form-group">
                      <label style={{ color: '#8a4b00' }}>Making Charge</label>
                      <div style={{ display: 'flex', alignItems: 'stretch' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.makingCharge}
                          onChange={e => setFormData({ ...formData, makingCharge: e.target.value })}
                          placeholder={formData.mcType === 'flat' ? "e.g. 1500" : "e.g. 12"}
                          style={{
                            flex: 1,
                            borderRight: '1px solid #e8c974',
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                            borderColor: '#e8c974',
                            outline: 'none',
                            boxShadow: 'none',
                            margin: 0
                          }}
                        />
                        <select
                          value={formData.mcType}
                          onChange={e => setFormData({ ...formData, mcType: e.target.value })}
                          style={{
                            width: '65px',
                            padding: '0',
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            borderLeft: 'none',
                            borderColor: '#e8c974',
                            backgroundColor: '#fffdf4',
                            outline: 'none',
                            boxShadow: 'none',
                            cursor: 'pointer',
                            textAlign: 'center',
                            margin: 0
                          }}
                        >
                          <option value="flat">₹</option>
                          <option value="percent">%</option>
                        </select>
                      </div>
                    </div>

                    <div className="pro-form-group">
                      <label style={{ color: '#8a4b00' }}>Metal Purity</label>
                      <select value={formData.purity} onChange={e => setFormData({ ...formData, purity: e.target.value })} style={{ borderColor: '#e8c974', outlineColor: '#e0b024' }}>
                        <option value="22K Gold">22K Gold</option>
                        <option value="24K Gold">24K Gold</option>
                        <option value="18K Gold">18K Gold</option>
                        <option value="Silver (925)">Silver (925)</option>
                        <option value="Platinum">Platinum</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', padding: '15px', background: '#fff9e6', border: '1px dashed #e0b024', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <ProductPriceCalculator formData={formData} liveRates={liveRates} />
                  </div>
                </div>

                <div className="pro-form-section">
                  <h4>Additional Information</h4>
                </div>

                <div className="pro-form-group">
                  <label>Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div className="pro-form-group full-width">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ marginBottom: 0, fontWeight: 'bold' }}>
                      Product Images ({((formData.images?.length || 0) + imageFiles.length)} of 5+ images)
                    </label>
                    <span style={{ fontSize: '0.85rem', color: ((formData.images?.length || 0) + imageFiles.length) >= 5 ? '#2e7d32' : '#888', fontWeight: 'bold' }}>
                      {((formData.images?.length || 0) + imageFiles.length) >= 5 ? '✓ 5 Images Ready' : 'Add 5 images for gallery'}
                    </span>
                  </div>

                  <div className="file-dropzone" style={{ border: '2px dashed #d4af37', background: '#fffdf7', padding: '18px' }}>
                    <div className="file-drop-icon" style={{ fontSize: '1.8rem' }}>📸</div>
                    <div className="file-drop-text" style={{ fontWeight: 'bold', color: '#333' }}>
                      {imageFiles.length > 0 ? `${imageFiles.length} new image(s) added` : "Click here to select images"}
                    </div>
                    <div className="file-drop-subtext">You can select 1 or all 5 images at once (JPG, PNG, WEBP)</div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={e => {
                        if (e.target.files && e.target.files.length > 0) {
                          setImageFiles(prev => [...prev, ...Array.from(e.target.files)]);
                          e.target.value = '';
                        }
                      }}
                      required={!(formData.images && formData.images.length > 0) && imageFiles.length === 0}
                    />
                  </div>

                  {/* 5 Permanent Image Cards */}
                  <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                    {[0, 1, 2, 3, 4].map(idx => {
                      const allExisting = formData.images || [];
                      const isCover = idx === 0;

                      let item = null;
                      if (idx < allExisting.length) {
                        item = { type: 'existing', src: allExisting[idx], index: idx };
                      } else if (idx < allExisting.length + imageFiles.length) {
                        const fileIdx = idx - allExisting.length;
                        item = { type: 'new', src: URL.createObjectURL(imageFiles[fileIdx]), fileIdx };
                      }

                      return (
                        <div key={idx} style={{
                          position: 'relative',
                          height: '110px',
                          border: item 
                            ? (isCover ? '2px solid #2e7d32' : '2px solid #d4af37') 
                            : (isCover ? '2px dashed #2e7d32' : '2px dashed #cbd5e0'),
                          borderRadius: '8px',
                          background: item ? '#fff' : (isCover ? '#f0fff4' : '#fafafa'),
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          boxShadow: item ? '0 2px 5px rgba(0,0,0,0.06)' : 'none'
                        }}>
                          {item ? (
                            <>
                              <img 
                                src={item.src} 
                                alt={`Slot ${idx + 1}`} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />
                              <span style={{
                                position: 'absolute', 
                                bottom: '4px', 
                                left: '4px', 
                                background: isCover ? '#2e7d32' : 'rgba(0,0,0,0.75)', 
                                color: '#fff', 
                                fontSize: '10px', 
                                padding: '1px 5px', 
                                borderRadius: '3px', 
                                fontWeight: 'bold'
                              }}>
                                {isCover ? '★ Cover' : `#${idx + 1}`}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item.type === 'existing') {
                                    const copy = [...formData.images];
                                    copy.splice(item.index, 1);
                                    setFormData({ ...formData, images: copy });
                                  } else {
                                    setImageFiles(prev => prev.filter((_, i) => i !== item.fileIdx));
                                  }
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  background: '#e53e3e',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  border: '2px solid #fff',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                  zIndex: 4
                                }}
                                title={`Remove Image ${idx + 1}`}
                              >×</button>
                            </>
                          ) : (
                            <div style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                              padding: '5px',
                              textAlign: 'center',
                              color: isCover ? '#2e7d32' : '#888',
                              userSelect: 'none',
                              cursor: 'pointer'
                            }}>
                              <span style={{ fontSize: '22px', lineHeight: '20px' }}>+</span>
                              <span style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '2px' }}>
                                {isCover ? 'Cover Image' : `Image ${idx + 1}`}
                              </span>
                              <span style={{ fontSize: '9px', color: '#aaa', marginTop: '2px' }}>Click to add</span>
                              <input
                                type="file"
                                accept="image/*"
                                title={`Click to select Image ${idx + 1}`}
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  opacity: 0,
                                  cursor: 'pointer',
                                  zIndex: 3
                                }}
                                onChange={e => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    setImageFiles(prev => [...prev, ...Array.from(e.target.files)]);
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsFormOpen(false)} disabled={isSaving}>Close</button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductPanel;
