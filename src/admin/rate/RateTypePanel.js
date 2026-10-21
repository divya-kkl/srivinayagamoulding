import React, { useState, useEffect } from 'react';
import '../AdminPanel.css';
import { 
  getRateTypesFromSupabase, 
  createRateTypeInSupabase, 
  updateRateTypeInSupabase, 
  deleteRateTypeInSupabase 
} from '../../services/rateTypeService';

const RateTypePanel = () => {
  const [rateTypes, setRateTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const initialFormState = { name: '', description: '', status: 'ACTIVE' };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const { data } = await getRateTypesFromSupabase();
    if (data) setRateTypes(data);
    setIsLoading(false);
  };

  const openForm = (typeItem = null) => {
    if (typeItem) {
      setEditingType(typeItem);
      setFormData({
        name: typeItem.name,
        description: typeItem.description || '',
        status: typeItem.status || 'ACTIVE'
      });
    } else {
      setEditingType(null);
      setFormData(initialFormState);
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    if (editingType) {
      const res = await updateRateTypeInSupabase(editingType.dbId || editingType.id, formData);
      if (res.success) {
        await loadData();
        setIsFormOpen(false);
      } else {
        alert("Error updating rate type: " + (res.error || 'Unknown error'));
      }
    } else {
      const res = await createRateTypeInSupabase(formData);
      if (res.success) {
        await loadData();
        setIsFormOpen(false);
      } else {
        alert("Error creating rate type: " + (res.error || 'Unknown error'));
      }
    }
    setIsSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete Rate Type "${name}"?`)) {
      const res = await deleteRateTypeInSupabase(id, name);
      if (res.success) {
        await loadData();
      } else {
        alert(`⚠️ Cannot Delete Rate Type!\n\n${res.error || 'Failed to delete.'}`);
      }
    }
  };

  const filteredRateTypes = rateTypes.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Rate Types List</h3>
          <div className="admin-controls">
            <input 
              type="text" 
              className="admin-search"
              placeholder="Search..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button className="admin-btn-primary" onClick={() => openForm()}>
              + Add Rate Type
            </button>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>S.NO</th>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`shimmer-${idx}`}>
                    <td><div className="admin-shimmer" style={{ width: '30px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '120px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '180px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '60px', height: '24px', borderRadius: '12px' }}></div></td>
                    <td>
                      <div className="admin-shimmer" style={{ display: 'inline-block', width: '30px', height: '30px', marginRight: '5px' }}></div>
                      <div className="admin-shimmer" style={{ display: 'inline-block', width: '30px', height: '30px' }}></div>
                    </td>
                  </tr>
                ))
              ) : filteredRateTypes.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '30px'}}>No rate types found</td></tr>
              ) : (
                filteredRateTypes.map((rt, index) => (
                  <tr key={rt.dbId || rt.id || index}>
                    <td style={{color: '#007bff'}}>{index + 1}</td>
                    <td>
                      <div className="list-title">{rt.name}</div>
                    </td>
                    <td>
                      <div style={{color: '#555', fontSize: '0.85rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                        {rt.description || '-'}
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${rt.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                        {rt.status}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn edit" onClick={() => openForm(rt)} title="Edit">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(rt.dbId || rt.id, rt.name)} title="Delete">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3>{editingType ? 'Edit Rate Type' : 'Add Rate Type'}</h3>
              <button className="close-modal-btn" onClick={() => setIsFormOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="admin-modal-body">
                <div className="form-group">
                  <label>Name (e.g. 22K Gold, 24K Gold, Silver 925) *</label>
                  <input 
                    required 
                    type="text"
                    placeholder="22K Gold"
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    rows="3"
                    placeholder="916 Hallmark Standard Gold"
                    style={{padding: '10px 12px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none', resize: 'vertical', fontFamily: 'inherit'}}
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

export default RateTypePanel;
