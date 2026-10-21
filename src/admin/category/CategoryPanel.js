import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../AdminPanel.css';
import {
  fetchCategories,
  deleteCategory,
  openForm,
  closeForm,
  setFormData,
  setSearchQuery,
  setIsSaving,
} from '../../redux/slices/categoriesSlice';
import {
  createCategoryInSupabase,
  updateCategoryInSupabase,
  uploadImageToSupabase,
} from '../../services/categoryService';

const CategoryPanel = () => {
  const dispatch = useDispatch();
  const {
    items: categories,
    isLoading,
    isSaving,
    searchQuery,
    isFormOpen,
    editingCategory,
    formData,
  } = useSelector((state) => state.categories);

  const [imageFile, setImageFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(fetchCategories(false));
  }, [dispatch]);

  const handleOpenForm = (category = null) => {
    setImageFile(null);
    dispatch(openForm(category));
  };

  const handleCloseForm = () => {
    setImageFile(null);
    dispatch(closeForm());
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    dispatch(setIsSaving(true));

    let finalImageUrl = formData.image;
    if (imageFile) {
      const { success, url, error } = await uploadImageToSupabase(imageFile);
      if (!success) {
        alert("Image upload failed! \nNote: Neenga Supabase-la 'Storage' kulla poi 'images' nu oru pudhu bucket create pannanum (Public access kooda).\nError: " + error);
        dispatch(setIsSaving(false));
        return;
      }
      finalImageUrl = url;
    }

    const payload = { ...formData, image: finalImageUrl };

    if (editingCategory) {
      const { success, error } = await updateCategoryInSupabase(editingCategory.dbId, payload);
      if (success) {
        dispatch(fetchCategories(false));
        handleCloseForm();
      } else {
        alert("Error updating: " + error);
      }
    } else {
      const { success, error } = await createCategoryInSupabase(payload);
      if (success) {
        dispatch(fetchCategories(false));
        handleCloseForm();
      } else {
        alert("Error creating: " + error);
      }
    }
    dispatch(setIsSaving(false));
  };

  const handleDelete = async (dbId, name) => {
    if (window.confirm(`Delete category "${name}"?`)) {
      const res = await dispatch(deleteCategory({ dbId }));
      if (res.error) {
        alert(`⚠️ Cannot Delete Category!\n\n${res.payload || 'Failed to delete category.'}`);
      }
    }
  };

  const q = (searchQuery || '').trim().toLowerCase();
  const filteredCategories = categories.filter(c => {
    if (!q) return true;
    const name = (c?.name || '').toLowerCase();
    const desc = (c?.description || '').toLowerCase();
    const status = (c?.status || '').toLowerCase();
    return name.includes(q) || desc.includes(q) || status.includes(q);
  });

  const totalItems = filteredCategories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

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
            <h3 style={{ margin: 0 }}>Categories List</h3>
            {!isLoading && filteredCategories.length > 0 && (
              <div className="admin-pagination-info" style={{ marginTop: '5px', fontSize: '0.86rem' }}>
                Showing <span>{startIndex + 1}</span> to <span>{endIndex}</span> of <span>{totalItems}</span> categories
              </div>
            )}
          </div>
          <div className="admin-controls">
            <input 
              type="text" 
              className="admin-search" 
              placeholder="Search category name..." 
              value={searchQuery || ''}
              onChange={(e) => {
                dispatch(setSearchQuery(e.target.value));
                setCurrentPage(1);
              }}
            />
            <button className="admin-btn-primary" onClick={() => handleOpenForm()}>
              + Add Category
            </button>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>S.NO</th>
                <th>Image</th>
                <th>Name</th>
                <th>Description</th>
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
                    <td><div className="admin-shimmer" style={{ width: '150px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '60px', height: '24px', borderRadius: '12px' }}></div></td>
                    <td>
                      <div className="admin-shimmer" style={{ display: 'inline-block', width: '30px', height: '30px', marginRight: '5px' }}></div>
                      <div className="admin-shimmer" style={{ display: 'inline-block', width: '30px', height: '30px' }}></div>
                    </td>
                  </tr>
                ))
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '30px', color: '#666'}}>
                    {searchQuery ? `No category found matching "${searchQuery}"` : 'No categories found'}
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((cat, index) => (
                  <tr key={cat.dbId}>
                    <td style={{color: '#007bff'}}>{startIndex + index + 1}</td>
                    <td>
                      <img src={cat.image} alt={cat.name} className="list-img" />
                    </td>
                    <td>
                      <div className="list-title">{cat.name}</div>
                    </td>
                    <td>
                      <div style={{color: '#555', fontSize: '0.85rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                        {cat.description || '-'}
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${cat.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                        {cat.status}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn edit" onClick={() => handleOpenForm(cat)} title="Edit">
                        ✎
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(cat.dbId, cat.name)} title="Delete">
                        🗑
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredCategories.length > 0 && (
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
              <h3>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
              <button className="close-modal-btn" onClick={handleCloseForm}>×</button>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className="admin-modal-body">
                <div className="form-group">
                  <label>Name</label>
                  <input required value={formData.name} onChange={e => dispatch(setFormData({ name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    value={formData.description} 
                    onChange={e => dispatch(setFormData({ description: e.target.value }))} 
                    rows="3"
                    style={{padding: '10px 12px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none', resize: 'vertical', fontFamily: 'inherit'}}
                  />
                </div>
                <div className="form-group">
                  <label>Category Image</label>
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
                  <select value={formData.status} onChange={e => dispatch(setFormData({ status: e.target.value }))}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseForm} disabled={isSaving}>Close</button>
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

export default CategoryPanel;
