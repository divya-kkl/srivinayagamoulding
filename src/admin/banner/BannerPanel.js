import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../AdminPanel.css';
import {
  fetchBanners,
  deleteBanner,
  openForm,
  closeForm,
  setFormData,
  setIsSaving,
} from '../../redux/slices/bannersSlice';
import {
  createBannerInSupabase,
  updateBannerInSupabase,
  uploadBannerImageToSupabase,
} from '../../services/bannerService';

const BannerPanel = () => {
  const dispatch = useDispatch();
  const {
    items: banners,
    isLoading,
    isFormOpen,
    editingBanner,
    formData,
    isSaving,
  } = useSelector((state) => state.banners);

  const [imageFiles, setImageFiles] = useState([]);

  useEffect(() => {
    dispatch(fetchBanners(false));
  }, [dispatch]);

  const handleOpenForm = (banner = null) => {
    setImageFiles([]);
    dispatch(openForm(banner));
  };

  const handleCloseForm = () => {
    setImageFiles([]);
    dispatch(closeForm());
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    dispatch(setIsSaving(true));

    if (editingBanner) {
      let finalImageUrl = formData.image;
      if (imageFiles.length > 0) {
        const { success, url, error } = await uploadBannerImageToSupabase(imageFiles[0]);
        if (!success) {
          alert('Image upload failed! \nError: ' + error);
          dispatch(setIsSaving(false));
          return;
        }
        finalImageUrl = url;
      }

      const payload = { ...formData, image: finalImageUrl };
      const { success, error } = await updateBannerInSupabase(editingBanner.dbId, payload);
      if (success) {
        dispatch(fetchBanners(false));
        handleCloseForm();
      } else {
        alert('Error updating: ' + error);
      }
    } else {
      if (imageFiles.length === 0) {
        alert('Please select at least one image.');
        dispatch(setIsSaving(false));
        return;
      }

      for (let i = 0; i < imageFiles.length; i++) {
        const { success, url, error } = await uploadBannerImageToSupabase(imageFiles[i]);
        if (success) {
          const payload = { image: url, status: formData.status };
          await createBannerInSupabase(payload);
        } else {
          alert('Image upload failed for ' + imageFiles[i].name + '! \nError: ' + error);
        }
      }

      dispatch(fetchBanners(false));
      handleCloseForm();
    }
    dispatch(setIsSaving(false));
  };

  const handleDelete = async (dbId) => {
    if (window.confirm('Delete this banner?')) {
      dispatch(deleteBanner(dbId));
    }
  };

  return (
    <>
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Banners List</h3>
          <div className="admin-controls">
            <button className="admin-btn-primary" onClick={() => handleOpenForm()}>
              + Add Banners
            </button>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>S.NO</th>
                <th>Banner Image</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`shimmer-${idx}`}>
                    <td><div className="admin-shimmer" style={{ width: '30px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '200px', height: '80px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '60px', height: '24px', borderRadius: '12px' }}></div></td>
                    <td>
                      <div className="admin-shimmer" style={{ display: 'inline-block', width: '30px', height: '30px', marginRight: '5px' }}></div>
                      <div className="admin-shimmer" style={{ display: 'inline-block', width: '30px', height: '30px' }}></div>
                    </td>
                  </tr>
                ))
              ) : banners.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px' }}>No banners found</td></tr>
              ) : (
                banners.map((banner, index) => (
                  <tr key={banner.dbId}>
                    <td style={{ color: '#007bff', width: '50px' }}>{index + 1}</td>
                    <td>
                      <img src={banner.image} alt="Banner" className="list-img" style={{ width: '200px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                    </td>
                    <td>
                      <span className={`status-pill ${banner.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                        {banner.status}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn edit" onClick={() => handleOpenForm(banner)} title="Edit">
                        ✎
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(banner.dbId)} title="Delete">
                        🗑
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
          <div className="admin-modal-content" style={{ maxWidth: '500px' }}>
            <div className="admin-modal-header">
              <h3>{editingBanner ? 'Edit Banner' : 'Add Banners'}</h3>
              <button className="close-modal-btn" onClick={handleCloseForm}>×</button>
            </div>
            <form onSubmit={handleSaveBanner}>
              <div className="admin-modal-body">

                <div className="form-group">
                  <label>Banner Images</label>
                  <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '8px' }}>You can select multiple images to upload at once.</p>

                  {formData.image && imageFiles.length === 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <img src={formData.image} alt="preview" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple={!editingBanner}
                    onChange={e => setImageFiles(Array.from(e.target.files))}
                    required={!formData.image && imageFiles.length === 0}
                  />
                  {imageFiles.length > 0 && (
                    <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#007bff' }}>
                      {imageFiles.length} file(s) selected
                    </div>
                  )}
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
                  {isSaving ? 'Saving...' : 'Save Banners'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default BannerPanel;
