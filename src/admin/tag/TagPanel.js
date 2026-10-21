import React, { useState, useEffect } from 'react';
import '../AdminPanel.css';
import { getTagsFromSupabase, createTagInSupabase, updateTagInSupabase, deleteTagInSupabase } from '../../services/tagService';

const TagPanel = () => {
  const [tags, setTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const initialFormState = { name: '', code: '', description: '', status: 'ACTIVE' };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const { data } = await getTagsFromSupabase();
    if (data) setTags(data);
    setIsLoading(false);
  };

  const openForm = (tag = null) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({
        name: tag.name,
        code: tag.code,
        description: tag.description,
        status: tag.status
      });
    } else {
      setEditingTag(null);
      setFormData(initialFormState);
    }
    setIsFormOpen(true);
  };

  const handleSaveTag = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    if (editingTag) {
      const { success, error } = await updateTagInSupabase(editingTag.dbId, formData);
      if (success) {
        loadData();
        setIsFormOpen(false);
      } else {
        alert("Error updating: " + error);
      }
    } else {
      const { success, error } = await createTagInSupabase(formData);
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
    if (window.confirm(`Delete tag "${name}"?`)) {
      const { success } = await deleteTagInSupabase(dbId);
      if (success) loadData();
    }
  };

  const q = (searchQuery || '').trim().toLowerCase();
  const filteredTags = tags.filter(t => {
    if (!q) return true;
    const name = (t?.name || '').toLowerCase();
    const code = (t?.code || '').toLowerCase();
    const desc = (t?.description || '').toLowerCase();
    const status = (t?.status || '').toLowerCase();
    return name.includes(q) || code.includes(q) || desc.includes(q) || status.includes(q);
  });

  const totalItems = filteredTags.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedTags = filteredTags.slice(startIndex, endIndex);

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
            <h3 style={{ margin: 0 }}>Tags List</h3>
            {!isLoading && filteredTags.length > 0 && (
              <div className="admin-pagination-info" style={{ marginTop: '5px', fontSize: '0.86rem' }}>
                Showing <span>{startIndex + 1}</span> to <span>{endIndex}</span> of <span>{totalItems}</span> tags
              </div>
            )}
          </div>
          <div className="admin-controls">
            <input 
              type="text" 
              className="admin-search" 
              placeholder="Search tag name, code..." 
              value={searchQuery || ''}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            <button className="admin-btn-primary" onClick={() => openForm()}>
              + Add Tag
            </button>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>S.NO</th>
                <th>Name</th>
                <th>Code</th>
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
                    <td><div className="admin-shimmer" style={{ width: '100px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '80px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '150px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '60px', height: '24px', borderRadius: '12px' }}></div></td>
                    <td>
                      <div className="admin-shimmer" style={{ display: 'inline-block', width: '30px', height: '30px', marginRight: '5px' }}></div>
                      <div className="admin-shimmer" style={{ display: 'inline-block', width: '30px', height: '30px' }}></div>
                    </td>
                  </tr>
                ))
              ) : filteredTags.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '30px', color: '#666'}}>
                    {searchQuery ? `No tags found matching "${searchQuery}"` : 'No tags found'}
                  </td>
                </tr>
              ) : (
                paginatedTags.map((tag, index) => (
                  <tr key={tag.dbId}>
                    <td style={{color: '#007bff'}}>{startIndex + index + 1}</td>
                    <td>
                      <div className="list-title">{tag.name}</div>
                    </td>
                    <td>
                      <div style={{color: '#666', fontSize: '0.9rem'}}>{tag.code}</div>
                    </td>
                    <td>
                      <div style={{color: '#888', fontSize: '0.85rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                        {tag.description}
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${tag.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                        {tag.status}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn edit" onClick={() => openForm(tag)} title="Edit">✎</button>
                      <button className="action-btn delete" onClick={() => handleDelete(tag.dbId, tag.name)} title="Delete">🗑</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredTags.length > 0 && (
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
          <div className="admin-modal-content" style={{maxWidth: '500px'}}>
            <div className="admin-modal-header">
              <h3>{editingTag ? 'Edit Tag' : 'Add Tag'}</h3>
              <button className="close-modal-btn" onClick={() => setIsFormOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveTag}>
              <div className="admin-modal-body" style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                
                <div className="form-group">
                  <label>Name *</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., Summer Sale" style={{padding: '12px', border: '1px solid #ddd', borderRadius: '6px'}} />
                </div>

                <div className="form-group">
                  <label>Code *</label>
                  <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="e.g., SUMMERSALE" style={{padding: '12px', border: '1px solid #ddd', borderRadius: '6px'}} />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Tag description..." rows="4" style={{padding: '12px', border: '1px solid #ddd', borderRadius: '6px', resize: 'vertical', fontFamily: 'inherit'}} />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{padding: '12px', border: '1px solid #ddd', borderRadius: '6px'}}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="admin-modal-footer" style={{padding: '20px 25px', gap: '15px'}}>
                <button type="button" className="btn-secondary" onClick={() => setIsFormOpen(false)} disabled={isSaving} style={{padding: '10px 20px', background: '#fff', border: '1px solid #ddd', color: '#444'}}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSaving} style={{padding: '10px 20px', background: '#4a1525', color: '#fff', border: 'none', borderRadius: '4px'}}>
                  {isSaving ? 'Creating...' : (editingTag ? 'Update Tag' : 'Create Tag')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TagPanel;
