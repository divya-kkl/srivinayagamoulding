import React, { useState, useEffect } from 'react';
import { getRatesFromSupabase, createRateInSupabase, updateRateInSupabase, deleteRateFromSupabase } from '../../services/rateService';
import { getRateTypesFromSupabase } from '../../services/rateTypeService';

const RatePanel = () => {
  const [rates, setRates] = useState([]);
  const [rateTypes, setRateTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const initialFormState = { date: today, name: '', type: '22K Gold', gram: 1, amount: '', isCurrent: false, gst: 3 };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    setIsLoading(true);
    const { data, error } = await getRatesFromSupabase();
    if (!error && data) {
      setRates(data);
    }
    const { data: typeData } = await getRateTypesFromSupabase(true);
    if (typeData && typeData.length > 0) {
      setRateTypes(typeData);
    }
    setIsLoading(false);
  };

  const openForm = (rate = null) => {
    if (rate) {
      setEditingRate(rate);
      setFormData({
        date: rate.date,
        name: rate.name,
        type: rate.type || '22K Gold',
        gram: rate.gram,
        amount: rate.amount,
        isCurrent: rate.isCurrent,
        gst: rate.gst
      });
    } else {
      setEditingRate(null);
      setFormData(initialFormState);
    }
    setIsFormOpen(true);
  };

  const handleSaveRate = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    let res;
    if (editingRate) {
      res = await updateRateInSupabase(editingRate.dbId, formData);
    } else {
      res = await createRateInSupabase(formData);
    }

    if (!res.error) {
      await loadRates();
      setIsFormOpen(false);
    } else {
      alert("Error saving rate: " + res.error);
    }
    setIsSaving(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this rate?")) {
      const res = await deleteRateFromSupabase(id);
      if (!res.error) {
        setRates(rates.filter(r => r.dbId !== id));
      } else {
        alert("Error deleting rate: " + res.error);
      }
    }
  };

  return (
    <>
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Daily Live Rates</h3>
          <div className="admin-controls">
            <button className="admin-btn-primary" onClick={() => openForm()}>
              + Add New Rate
            </button>
          </div>
        </div>

        <div className="admin-table-wrapper">
          {isLoading ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Gram</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`shimmer-${idx}`}>
                    <td><div className="admin-shimmer" style={{ width: '80px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '100px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '80px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '30px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '60px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '60px', height: '24px', borderRadius: '12px' }}></div></td>
                    <td>
                      <div className="admin-shimmer" style={{ display: 'inline-block', width: '40px', height: '25px', marginRight: '5px' }}></div>
                      <div className="admin-shimmer" style={{ display: 'inline-block', width: '50px', height: '25px' }}></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : rates.length === 0 ? (
            <div className="empty-state">
              <p>No rates added yet. Add a rate to get started!</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Gram</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <tr key={rate.dbId}>
                    <td><div style={{ fontWeight: 'bold', color: '#5e0b15' }}>{new Date(rate.date).toLocaleDateString()}</div></td>
                    <td><div className="list-title">{rate.name}</div></td>
                    <td><div className="list-title" style={{ color: '#b8860b' }}>{rate.type}</div></td>
                    <td><div className="list-title">{rate.gram}</div></td>
                    <td><div className="list-title" style={{ color: '#000' }}>₹{rate.amount}</div></td>
                    <td>
                      <span className={`status-pill ${rate.isCurrent ? 'active' : 'inactive'}`}>
                        {rate.isCurrent ? 'Current' : 'History'}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn edit" onClick={() => openForm(rate)} title="Edit">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(rate.dbId)} title="Delete">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isFormOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content" style={{ maxWidth: '600px' }}>
            <div className="admin-modal-header">
              <h3>{editingRate ? 'Edit Rate' : 'Add New Rate'}</h3>
              <button className="close-modal-btn" onClick={() => setIsFormOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveRate}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="pro-form-group">
                    <label>Date *</label>
                    <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                  </div>
                  <div className="pro-form-group">
                    <label>Name (e.g. 22K Gold) *</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="22K Gold" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  <div className="pro-form-group">
                    <label>Type *</label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                    >
                      {rateTypes && rateTypes.length > 0 ? (
                        rateTypes.map(rt => (
                          <option key={rt.id || rt.name} value={rt.name}>
                            {rt.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="22K Gold">22K Gold</option>
                          <option value="24K Gold">24K Gold</option>
                          <option value="18K Gold">18K Gold</option>
                          <option value="Silver (925)">Silver (925)</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="pro-form-group">
                    <label>Gram *</label>
                    <input type="number" required value={formData.gram} onChange={e => setFormData({ ...formData, gram: e.target.value })} placeholder="1" />
                  </div>
                  <div className="pro-form-group">
                    <label>Amount (₹) *</label>
                    <input type="number" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="7500" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'end' }}>
                  <div className="pro-form-group">
                    <label>GST (%)</label>
                    <input type="number" value={formData.gst} onChange={e => setFormData({ ...formData, gst: e.target.value })} />
                  </div>
                  <div className="pro-form-group" style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      <input type="checkbox" checked={formData.isCurrent} onChange={e => setFormData({ ...formData, isCurrent: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                      Set as Current Rate
                    </label>
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer" style={{ padding: '20px 25px', gap: '15px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsFormOpen(false)} disabled={isSaving} style={{ padding: '10px 20px', background: '#fff', border: '1px solid #ddd', color: '#444' }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSaving} style={{ padding: '10px 20px', background: '#4a1525', color: '#fff', border: 'none', borderRadius: '4px' }}>
                  {isSaving ? 'Saving...' : 'Create Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default RatePanel;
