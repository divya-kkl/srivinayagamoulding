import React, { useState, useEffect } from 'react';
import '../AdminPanel.css';
import { 
  getSubcategoriesFromSupabase, 
  createSubcategoryInSupabase, 
  updateSubcategoryInSupabase, 
  deleteSubcategoryInSupabase, 
  uploadSubcategoryImageToSupabase 
} from '../../services/subcategoryService';
import { getCategoriesFromSupabase } from '../../services/categoryService';

const SubcategoryPanel = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    description: '',
    image: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const catRes = await getCategoriesFromSupabase(false);
    if (catRes.data) setCategories(catRes.data);

    const subcatRes = await getSubcategoriesFromSupabase();
    if (subcatRes.data) {
      // Level 1 Subcategories only (where subcategoryId is null)
      const level1 = subcatRes.data.filter(s => !s.subcategoryId);
      setSubcategories(level1);
    }
    setIsLoading(false);
  };

  const openForm = (subcategory = null) => {
    if (subcategory) {
      setEditingSubcategory(subcategory);
      setFormData({
        categoryId: subcategory.categoryId,
        name: subcategory.name,
        description: subcategory.description,
        image: subcategory.image,
        status: subcategory.status
      });
    } else {
      setEditingSubcategory(null);
      setFormData({
        categoryId: categories.length > 0 ? categories[0].dbId : '',
        name: '',
        description: '',
        image: '',
        status: 'ACTIVE'
      });
    }
    setImageFile(null);
    setIsFormOpen(true);
  };

  const handleSaveSubcategory = async (e) => {
    e.preventDefault();
    if (!formData.categoryId) {
      alert("Please select a parent Category first!");
      return;
    }

    setIsSaving(true);

    let finalImageUrl = formData.image;
    if (imageFile) {
      const { success, url, error } = await uploadSubcategoryImageToSupabase(imageFile);
      if (!success) {
        alert("Image upload failed!\nError: " + error);
        setIsSaving(false);
        return;
      }
      finalImageUrl = url;
    }

    const payload = { 
      ...formData, 
      subcategoryId: null, // Level 1 subcategory always has subcategoryId = null
      image: finalImageUrl 
    };

    if (editingSubcategory) {
      const { success, error } = await updateSubcategoryInSupabase(editingSubcategory.dbId, payload);
      if (success) {
        loadData();
        setIsFormOpen(false);
      } else {
        alert("Error updating: " + error);
      }
    } else {
      const { success, error } = await createSubcategoryInSupabase(payload);
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
    if (window.confirm(`Delete Subcategory "${name}"?`)) {
      const res = await deleteSubcategoryInSupabase(dbId);
      if (res.success) {
        loadData();
      } else {
        alert(`⚠️ Cannot Delete!\n\n${res.error || 'Failed to delete.'}`);
      }
    }
  };

  const q = (searchQuery || '').trim().toLowerCase();
  const filteredSubcategories = subcategories.filter(s => {
    if (!q) return true;
    const name = (s?.name || '').toLowerCase();
    const catName = (s?.categoryName || '').toLowerCase();
    const desc = (s?.description || '').toLowerCase();
    return name.includes(q) || catName.includes(q) || desc.includes(q);
  });

  const totalItems = filteredSubcategories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedSubcategories = filteredSubcategories.slice(startIndex, endIndex);

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
            <h3 style={{ margin: 0 }}>Subcategories List</h3>
            {!isLoading && filteredSubcategories.length > 0 && (
              <div className="admin-pagination-info" style={{ marginTop: '5px', fontSize: '0.86rem' }}>
                Showing <span>{startIndex + 1}</span> to <span>{endIndex}</span> of <span>{totalItems}</span> subcategories
              </div>
            )}
          </div>
          <div className="admin-controls">
            <input 
              type="text" 
              className="admin-search" 
              placeholder="Search subcategory name, main category..." 
              value={searchQuery || ''}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            <button className="admin-btn-primary" onClick={() => openForm()}>
              + Add Subcategory
            </button>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>S.NO</th>
                <th>Image</th>
                <th>Main Category</th>
                <th>Subcategory Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`shimmer-${idx}`}>
                    <td><div className="admin-shimmer" style={{ width: '30px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '45px', height: '45px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '100px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '140px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '60px', height: '24px' }}></div></td>
                    <td>
                      <div className="admin-shimmer" style={{ display: 'inline-block', width: '30px', height: '30px', marginRight: '5px' }}></div>
                      <div className="admin-shimmer" style={{ display: 'inline-block', width: '30px', height: '30px' }}></div>
                    </td>
                  </tr>
                ))
              ) : filteredSubcategories.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                    {searchQuery ? `No subcategories found matching "${searchQuery}"` : 'No subcategories found'}
                  </td>
                </tr>
              ) : (
                paginatedSubcategories.map((sub, index) => (
                  <tr key={sub.dbId}>
                    <td style={{color: '#007bff'}}>{startIndex + index + 1}</td>
                    <td>
                      <img src={sub.image} alt={sub.name} className="list-img" />
                    </td>
                    <td>
                      <div style={{fontWeight: 'bold', color: '#555'}}>{sub.categoryName}</div>
                    </td>
                    <td>
                      <div className="list-title">{sub.name}</div>
                      {sub.description && <div style={{color: '#888', fontSize: '0.8rem'}}>{sub.description}</div>}
                    </td>
                    <td>
                      <span className={`status-pill ${sub.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn edit" onClick={() => openForm(sub)} title="Edit">
                        ✎
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(sub.dbId, sub.name)} title="Delete">
                        🗑
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredSubcategories.length > 0 && (
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
              <h3>{editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}</h3>
              <button className="close-modal-btn" onClick={() => setIsFormOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveSubcategory}>
              <div className="admin-modal-body">
                <div className="form-group">
                  <label>Main Category *</label>
                  <select 
                    required 
                    value={formData.categoryId} 
                    onChange={e => setFormData({...formData, categoryId: e.target.value})}
                  >
                    <option value="" disabled>Select a Category...</option>
                    {categories.map(c => (
                      <option key={c.dbId} value={c.dbId}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Subcategory Name *</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Bangles, Necklaces, Rings" />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    rows="2"
                    placeholder="Short description..."
                    style={{padding: '10px 12px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none', resize: 'vertical', fontFamily: 'inherit'}}
                  />
                </div>

                <div className="form-group">
                  <label>Image</label>
                  {formData.image && !imageFile && (
                    <div style={{marginBottom: '10px'}}>
                      <img src={formData.image} alt="preview" style={{height: '60px', borderRadius: '4px', border: '1px solid #ddd'}} />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => setImageFile(e.target.files[0])} 
                    required={!formData.image && !imageFile}
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
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

export default SubcategoryPanel;
