import React, { useState, useEffect } from 'react';
import '../AdminPanel.css';
import { 
  getTestimonialsFromSupabase, 
  createTestimonialInSupabase, 
  updateTestimonialInSupabase, 
  deleteTestimonialInSupabase,
  uploadTestimonialImageToSupabase
} from '../../services/testimonialService';

const TestimonialPanel = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const initialFormState = {
    name: '',
    location: '',
    review: '',
    rating: 5,
    image: '',
    verifiedBuyer: true,
    status: true
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const res = await getTestimonialsFromSupabase(false);
    if (res.data) setTestimonials(res.data);
    setIsLoading(false);
  };

  const openForm = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        location: item.location || '',
        review: item.review,
        rating: item.rating,
        image: item.image || '',
        verifiedBuyer: item.verifiedBuyer,
        status: item.status
      });
    } else {
      setEditingItem(null);
      setFormData(initialFormState);
    }
    setImageFile(null);
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    let finalImageUrl = formData.image;
    if (imageFile) {
      const { success, url, error } = await uploadTestimonialImageToSupabase(imageFile);
      if (success) {
        finalImageUrl = url;
      } else {
        alert("Image upload failed: " + error);
        setIsSaving(false);
        return;
      }
    }

    const payload = { ...formData, image: finalImageUrl };

    if (editingItem) {
      const { success, error } = await updateTestimonialInSupabase(editingItem.dbId, payload);
      if (success) {
        loadData();
        setIsFormOpen(false);
      } else {
        alert("Error updating: " + error);
      }
    } else {
      const { success, error } = await createTestimonialInSupabase(payload);
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
    if (window.confirm(`Delete testimonial from "${name}"?`)) {
      const { success } = await deleteTestimonialInSupabase(dbId);
      if (success) loadData();
    }
  };

  const q = (searchQuery || '').trim().toLowerCase();
  const filteredTestimonials = testimonials.filter(t => {
    if (!q) return true;
    const name = (t?.name || '').toLowerCase();
    const location = (t?.location || '').toLowerCase();
    const review = (t?.review || '').toLowerCase();
    return name.includes(q) || location.includes(q) || review.includes(q);
  });

  const totalItems = filteredTestimonials.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedTestimonials = filteredTestimonials.slice(startIndex, endIndex);

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
            <h3 style={{ margin: 0 }}>Customer Testimonials</h3>
            {!isLoading && filteredTestimonials.length > 0 && (
              <div className="admin-pagination-info" style={{ marginTop: '5px', fontSize: '0.86rem' }}>
                Showing <span>{startIndex + 1}</span> to <span>{endIndex}</span> of <span>{totalItems}</span> testimonials
              </div>
            )}
          </div>
          <div className="admin-controls">
            <input 
              type="text" 
              className="admin-search" 
              placeholder="Search customer name, review, location..." 
              value={searchQuery || ''}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            <button className="admin-btn-primary" onClick={() => openForm()}>
              + Add Testimonial
            </button>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>S.NO</th>
                <th>Customer</th>
                <th>Review</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`shimmer-${idx}`}>
                    <td><div className="admin-shimmer" style={{ width: '30px', height: '15px' }}></div></td>
                    <td>
                      <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <div className="admin-shimmer" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
                        <div>
                          <div className="admin-shimmer" style={{ width: '100px', height: '15px', marginBottom: '4px' }}></div>
                          <div className="admin-shimmer" style={{ width: '80px', height: '12px' }}></div>
                        </div>
                      </div>
                    </td>
                    <td><div className="admin-shimmer" style={{ width: '200px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '80px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '60px', height: '24px', borderRadius: '12px' }}></div></td>
                    <td>
                      <div className="admin-shimmer" style={{ display: 'inline-block', width: '30px', height: '30px', marginRight: '5px' }}></div>
                      <div className="admin-shimmer" style={{ display: 'inline-block', width: '30px', height: '30px' }}></div>
                    </td>
                  </tr>
                ))
              ) : filteredTestimonials.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '30px', color: '#666'}}>
                    {searchQuery ? `No testimonials found matching "${searchQuery}"` : 'No testimonials found'}
                  </td>
                </tr>
              ) : (
                paginatedTestimonials.map((t, index) => (
                  <tr key={t.dbId}>
                    <td style={{color: '#007bff'}}>{startIndex + index + 1}</td>
                    <td>
                      <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        {t.image ? (
                          <img src={t.image} alt={t.name} style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover'}} />
                        ) : (
                          <div style={{width: '40px', height: '40px', borderRadius: '50%', background: '#e8c974', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold'}}>
                            {t.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div style={{fontWeight: 'bold', color: '#444'}}>{t.name}</div>
                          <div style={{fontSize: '0.8rem', color: '#888'}}>{t.location}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={t.review}>
                      "{t.review}"
                    </td>
                    <td style={{color: '#d4af37'}}>{'★'.repeat(t.rating)}</td>
                    <td>
                      <span className={`status-pill ${t.status ? 'active' : 'inactive'}`}>
                        {t.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn edit" onClick={() => openForm(t)} title="Edit">✎</button>
                      <button className="action-btn delete" onClick={() => handleDelete(t.dbId, t.name)} title="Delete">🗑</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredTestimonials.length > 0 && (
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
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3>{editingItem ? 'Edit Testimonial' : 'Add Testimonial'}</h3>
              <button className="close-modal-btn" onClick={() => setIsFormOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="admin-modal-body pro-form-grid">
                
                <div className="pro-form-group">
                  <label>Customer Name *</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Divya Lakshmi" />
                </div>

                <div className="pro-form-group">
                  <label>Location</label>
                  <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Chennai, TN" />
                </div>

                <div className="pro-form-group full-width">
                  <label>Review Content *</label>
                  <textarea 
                    required 
                    value={formData.review} 
                    onChange={e => setFormData({...formData, review: e.target.value})} 
                    placeholder="e.g. Excellent service and beautiful designs!"
                    rows="4"
                  />
                </div>

                <div className="pro-form-group">
                  <label>Rating (1-5)</label>
                  <select value={formData.rating} onChange={e => setFormData({...formData, rating: parseInt(e.target.value)})}>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>

                <div className="pro-form-group full-width">
                  <label>Customer Image</label>
                  <div className="file-dropzone" style={{position: 'relative', border: '2px dashed #d4af37', borderRadius: '8px', padding: '20px', textAlign: 'center', background: '#fff9e6', cursor: 'pointer', transition: 'all 0.3s ease'}}>
                    <div className="file-drop-icon" style={{fontSize: '2rem', marginBottom: '10px'}}>☁️</div>
                    <div className="file-drop-text" style={{color: '#666', fontWeight: '500'}}>
                      {imageFile ? imageFile.name : (formData.image ? "Click to change image" : "Drag and drop or click to upload")}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setImageFile(e.target.files[0])} 
                      style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer'}}
                    />
                  </div>
                  {formData.image && !imageFile && (
                    <div style={{marginTop: '10px', textAlign: 'center'}}>
                      <img src={formData.image} alt="Preview" style={{width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #d4af37'}} />
                    </div>
                  )}
                </div>

                <div className="pro-form-group" style={{display: 'flex', gap: '20px', marginTop: '10px'}}>
                  <label style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexDirection: 'row'}}>
                    <input 
                      type="checkbox" 
                      checked={formData.verifiedBuyer} 
                      onChange={e => setFormData({...formData, verifiedBuyer: e.target.checked})} 
                      style={{width: 'auto', transform: 'scale(1.2)'}}
                    />
                    <span style={{margin: 0, fontWeight: '500'}}>Verified Buyer</span>
                  </label>

                  <label style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexDirection: 'row'}}>
                    <input 
                      type="checkbox" 
                      checked={formData.status} 
                      onChange={e => setFormData({...formData, status: e.target.checked})} 
                      style={{width: 'auto', transform: 'scale(1.2)'}}
                    />
                    <span style={{margin: 0, fontWeight: '500'}}>Active (Show on Site)</span>
                  </label>
                </div>

              </div>
              <div className="admin-modal-footer" style={{display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee'}}>
                <button type="button" className="admin-btn-secondary" onClick={() => setIsFormOpen(false)} style={{padding: '10px 20px', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary" disabled={isSaving} style={{padding: '10px 20px', background: 'linear-gradient(135deg, #d4af37 0%, #aa8c2c 100%)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
                  {isSaving ? 'Saving...' : 'Save Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TestimonialPanel;
