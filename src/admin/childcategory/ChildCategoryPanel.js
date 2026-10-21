import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../AdminPanel.css';
import {
  fetchChildCategoriesData,
  deleteChildCategory,
  openForm,
  closeForm,
  setFormData,
  setSearchQuery,
  setSelectedParentFilter,
  setIsSaving,
} from '../../redux/slices/childCategoriesSlice';
import { 
  createSubcategoryInSupabase, 
  updateSubcategoryInSupabase, 
  uploadChildCategoryImageToSupabase 
} from '../../services/subcategoryService';

const ChildCategoryPanel = () => {
  const dispatch = useDispatch();
  const {
    childCategories,
    allSubcategories,
    categories,
    searchQuery,
    selectedParentFilter,
    isLoading,
    isSaving,
    isFormOpen,
    editingChild,
    formData,
  } = useSelector((state) => state.childCategories);

  const [imageFile, setImageFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(fetchChildCategoriesData());
  }, [dispatch]);

  // Helper to build tree hierarchy for parent dropdown (supports Level 1, Level 2, Level 3...)
  const buildTreeOptions = (items, parentSubId = null, depth = 0) => {
    const list = [];
    const filtered = items.filter(i => (i.subcategoryId || null) === parentSubId);

    for (const item of filtered) {
      list.push({
        ...item,
        label: `${'— '.repeat(depth)}${item.name} ${depth === 0 ? '(Main Subcategory)' : `(Level ${depth + 1} Child)`}`
      });
      list.push(...buildTreeOptions(items, item.dbId, depth + 1));
    }
    return list;
  };

  const handleOpenForm = (child = null) => {
    setImageFile(null);
    dispatch(openForm(child));
  };

  const handleCloseForm = () => {
    setImageFile(null);
    dispatch(closeForm());
  };

  const handleCategoryChange = (e) => {
    const newCatId = e.target.value;
    const availableParents = allSubcategories.filter(p => p.categoryId === newCatId);
    dispatch(setFormData({
      categoryId: newCatId,
      subcategoryId: availableParents.length > 0 ? availableParents[0].dbId : ''
    }));
  };

  const handleSaveChild = async (e) => {
    e.preventDefault();
    if (!formData.categoryId) {
      alert("Please select a Main Category!");
      return;
    }
    if (!formData.subcategoryId) {
      alert("Please select a Parent Subcategory! A Child Category must belong to a Subcategory.");
      return;
    }
    if (!formData.name.trim()) {
      alert("Please enter a name for the Child Category!");
      return;
    }

    dispatch(setIsSaving(true));
    let finalImageUrl = formData.image;

    if (imageFile) {
      const { success, url, error } = await uploadChildCategoryImageToSupabase(imageFile);
      if (!success) {
        alert("Image upload failed!\nNote: Supabase 'Storage' kulla poi 'childcategories' nu oru pudhu bucket create pannanum (Public bucket = ON).\nError: " + error);
        dispatch(setIsSaving(false));
        return;
      }
      finalImageUrl = url;
    }

    const payload = {
      categoryId: formData.categoryId,
      subcategoryId: formData.subcategoryId, // Link to parent (God, Hindu, etc.)
      name: formData.name.trim(),
      description: formData.description.trim(),
      image: finalImageUrl,
      status: formData.status
    };

    if (editingChild) {
      const { success, error } = await updateSubcategoryInSupabase(editingChild.dbId, payload);
      if (success) {
        dispatch(fetchChildCategoriesData());
        handleCloseForm();
      } else {
        alert("Error updating: " + error);
      }
    } else {
      const { success, error } = await createSubcategoryInSupabase(payload);
      if (success) {
        dispatch(fetchChildCategoriesData());
        handleCloseForm();
      } else {
        alert("Error creating: " + error);
      }
    }
    dispatch(setIsSaving(false));
  };

  const handleDelete = async (dbId, name) => {
    if (window.confirm(`Delete Child Category "${name}"?\nThis cannot be undone.`)) {
      const res = await dispatch(deleteChildCategory({ dbId }));
      if (res.error) {
        alert(`⚠️ Cannot Delete!\n\n${res.payload || 'Failed to delete.'}`);
      }
    }
  };

  const q = (searchQuery || '').trim().toLowerCase();
  const filteredChildren = childCategories.filter(child => {
    const matchesSearch = !q || (
      (child?.name || '').toLowerCase().includes(q) ||
      (child?.parentSubcategoryName && child.parentSubcategoryName.toLowerCase().includes(q)) ||
      (child?.categoryName && child.categoryName.toLowerCase().includes(q)) ||
      (child?.description && child.description.toLowerCase().includes(q))
    );

    const matchesParent = selectedParentFilter === 'ALL' || child.subcategoryId === selectedParentFilter;

    return matchesSearch && matchesParent;
  });

  const totalItems = filteredChildren.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedChildren = filteredChildren.slice(startIndex, endIndex);

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
            <h3 style={{ margin: 0 }}>Child Categories</h3>
            {!isLoading && filteredChildren.length > 0 && (
              <div className="admin-pagination-info" style={{ marginTop: '5px', fontSize: '0.86rem' }}>
                Showing <span>{startIndex + 1}</span> to <span>{endIndex}</span> of <span>{totalItems}</span> child categories
              </div>
            )}
          </div>
          <div className="admin-controls">
            <select
              className="admin-search"
              style={{ minWidth: '180px' }}
              value={selectedParentFilter}
              onChange={e => {
                dispatch(setSelectedParentFilter(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Parent Categories</option>
              {allSubcategories.map(parent => (
                <option key={parent.dbId} value={parent.dbId}>
                  Under {parent.name}
                </option>
              ))}
            </select>

            <input 
              type="text" 
              className="admin-search" 
              placeholder="Search child category name, parent..." 
              value={searchQuery || ''}
              onChange={e => {
                dispatch(setSearchQuery(e.target.value));
                setCurrentPage(1);
              }}
            />
            <button className="admin-btn-primary" onClick={() => handleOpenForm()}>
              + Add Child Category
            </button>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>S.NO</th>
                <th>Image</th>
                <th>Child Name</th>
                <th>Belongs Under (Parent)</th>
                <th>Main Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`shimmer-child-${idx}`}>
                    <td><div className="admin-shimmer" style={{ width: '30px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '45px', height: '45px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '130px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '100px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '100px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '60px', height: '24px' }}></div></td>
                    <td>
                      <div className="admin-shimmer" style={{ display: 'inline-block', width: '30px', height: '30px', marginRight: '5px' }}></div>
                      <div className="admin-shimmer" style={{ display: 'inline-block', width: '30px', height: '30px' }}></div>
                    </td>
                  </tr>
                ))
              ) : filteredChildren.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📂</div>
                    <div style={{ fontWeight: 'bold', color: '#555' }}>
                      {searchQuery ? `No child categories found matching "${searchQuery}"` : 'No child categories found'}
                    </div>
                    <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px' }}>
                      {searchQuery ? 'Try searching with another keyword.' : 'Click "+ Add Child Category" above to create your first child subcategory!'}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedChildren.map((child, index) => (
                  <tr key={child.dbId}>
                    <td style={{ color: '#007bff' }}>{startIndex + index + 1}</td>
                    <td>
                      <img src={child.image} alt={child.name} className="list-img" />
                    </td>
                    <td>
                      <div className="list-title" style={{ fontWeight: '600', color: '#1e293b' }}>
                        {child.name}
                      </div>
                      {child.description && (
                        <div style={{ color: '#888', fontSize: '0.8rem' }}>{child.description}</div>
                      )}
                    </td>
                    <td>
                      <span style={{ 
                        background: '#e0f2fe', 
                        color: '#0369a1', 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        fontSize: '0.82rem', 
                        fontWeight: '600' 
                      }}>
                        ↳ {child.parentSubcategoryName || 'Subcategory'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '500', color: '#555' }}>{child.categoryName}</div>
                    </td>
                    <td>
                      <span className={`status-pill ${child.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                        {child.status}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn edit" onClick={() => handleOpenForm(child)} title="Edit Child Category">
                        ✎
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(child.dbId, child.name)} title="Delete Child Category">
                        🗑
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredChildren.length > 0 && (
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

      {/* CRUD MODAL FOR CHILD CATEGORY */}
      {isFormOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3>{editingChild ? 'Edit Child Category' : 'Add New Child Category'}</h3>
              <button className="close-modal-btn" onClick={handleCloseForm}>×</button>
            </div>
            <form onSubmit={handleSaveChild}>
              <div className="admin-modal-body">
                <div className="form-group">
                  <label>1. Main Category *</label>
                  <select 
                    required 
                    value={formData.categoryId} 
                    onChange={handleCategoryChange}
                  >
                    <option value="" disabled>Select Main Category...</option>
                    {categories.map(c => (
                      <option key={c.dbId} value={c.dbId}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>2. Belongs Under Parent (Select Subcategory or Parent Child) *</label>
                  <select 
                    required 
                    value={formData.subcategoryId} 
                    onChange={e => dispatch(setFormData({ subcategoryId: e.target.value }))}
                  >
                    <option value="" disabled>Select Parent Subcategory...</option>
                    {buildTreeOptions(
                      allSubcategories.filter(p => (!formData.categoryId || p.categoryId === formData.categoryId) && p.dbId !== editingChild?.dbId)
                    ).map(p => (
                      <option key={p.dbId} value={p.dbId}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>3. Child Category Name *</label>
                  <input 
                    required 
                    value={formData.name} 
                    onChange={e => dispatch(setFormData({ name: e.target.value }))} 
                    placeholder="e.g. Hindu, Christian, Muslim, Vinayagar, Murugan" 
                  />
                </div>

                <div className="form-group">
                  <label>4. Description (Optional)</label>
                  <textarea 
                    value={formData.description} 
                    onChange={e => dispatch(setFormData({ description: e.target.value }))} 
                    rows="2"
                    placeholder="Short description of this collection..."
                    style={{ padding: '10px 12px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>

                <div className="form-group">
                  <label>5. Image</label>
                  {formData.image && !imageFile && (
                    <div style={{ marginBottom: '10px' }}>
                      <img src={formData.image} alt="preview" style={{ height: '60px', borderRadius: '4px', border: '1px solid #ddd' }} />
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
                  <label>6. Status</label>
                  <select value={formData.status} onChange={e => dispatch(setFormData({ status: e.target.value }))}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseForm} disabled={isSaving}>Close</button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : (editingChild ? 'Update Child Category' : 'Create Child Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChildCategoryPanel;
