import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../AdminPanel.css';
import {
  fetchBanner2,
  deleteBanner2,
  openForm,
  closeForm,
  setFormData,
  setIsSaving,
} from '../../redux/slices/banner2Slice';
import {
  createBanner2InSupabase,
  updateBanner2InSupabase,
  uploadBanner2ImageToSupabase,
} from '../../services/banner2Service';

const Banner2Panel = () => {
  const dispatch = useDispatch();
  const {
    items: banners,
    isLoading,
    isFormOpen,
    editingBanner,
    formData,
    isSaving,
    error,
  } = useSelector((state) => state.banner2);

  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploadProgress, setUploadProgress] = useState('');
  const [copyStatus, setCopyStatus] = useState(false);

  useEffect(() => {
    dispatch(fetchBanner2(false));
  }, [dispatch]);

  const handleOpenForm = (banner = null) => {
    setImageFiles([]);
    setPreviewUrls([]);
    setUploadProgress('');
    dispatch(openForm(banner));
  };

  const handleCloseForm = () => {
    setImageFiles([]);
    setPreviewUrls([]);
    setUploadProgress('');
    dispatch(closeForm());
  };

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    dispatch(setIsSaving(true));
    setUploadProgress('Starting upload...');

    if (editingBanner) {
      let finalImageUrl = formData.image;
      if (imageFiles.length > 0) {
        setUploadProgress('Uploading image...');
        const { success, url, error: uploadErr } = await uploadBanner2ImageToSupabase(imageFiles[0]);
        if (!success) {
          alert('Image upload failed! \nError: ' + uploadErr);
          dispatch(setIsSaving(false));
          setUploadProgress('');
          return;
        }
        finalImageUrl = url;
      }

      const payload = { ...formData, image: finalImageUrl };
      const { success, error: updateErr } = await updateBanner2InSupabase(editingBanner.dbId, payload);
      if (success) {
        dispatch(fetchBanner2(false));
        handleCloseForm();
      } else {
        alert('Error updating: ' + updateErr);
      }
    } else {
      if (imageFiles.length === 0) {
        alert('Please select at least one image.');
        dispatch(setIsSaving(false));
        setUploadProgress('');
        return;
      }

      for (let i = 0; i < imageFiles.length; i++) {
        setUploadProgress(`Uploading ${i + 1} of ${imageFiles.length} images to Supabase...`);
        const { success, url, error: uploadErr } = await uploadBanner2ImageToSupabase(imageFiles[i]);
        if (success) {
          const payload = { 
            image: url, 
            status: formData.status
          };
          const { success: createSuccess, error: createErr } = await createBanner2InSupabase(payload);
          if (!createSuccess) {
            alert('Failed to save in Supabase: ' + createErr);
          }
        } else {
          alert('Image upload failed for ' + imageFiles[i].name + '! \nError: ' + uploadErr);
        }
      }

      dispatch(fetchBanner2(false));
      handleCloseForm();
    }
    setUploadProgress('');
    dispatch(setIsSaving(false));
  };

  const handleDelete = async (dbId) => {
    if (window.confirm('Delete this Banner 2 item?')) {
      dispatch(deleteBanner2(dbId));
    }
  };

  const sqlCreateScript = `CREATE TABLE IF NOT EXISTS public.banner_2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.banner_2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.banner_2 FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update/delete" ON public.banner_2 FOR ALL USING (true);`;

  return (
    <>
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h3>Banner 2 List (Middle / Promotional Banner)</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#666' }}>
              Dynamic second banner section displayed on the homepage in place of Why Choose Us.
            </p>
          </div>
          <div className="admin-controls">
            <button className="admin-btn-primary" onClick={() => handleOpenForm()}>
              + Add Banner 2 (Upload Multiple)
            </button>
          </div>
        </div>

        {error && error.includes('banner_2') && (
          <div style={{
            background: '#FFFBEB',
            border: '1px solid #FCD34D',
            padding: '16px',
            margin: '16px',
            borderRadius: '8px',
            color: '#92400E'
          }}>
            <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠️ Supabase Table Setup Notice: 'banner_2'
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>
              The <code>banner_2</code> table does not exist in your Supabase database yet. Run this simple SQL snippet in your <strong>Supabase Dashboard &gt; SQL Editor</strong> to enable instant syncing:
            </p>
            <pre style={{
              background: '#1F2937',
              color: '#F9FAFB',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              overflowX: 'auto',
              margin: '0 0 10px 0'
            }}>
              {sqlCreateScript}
            </pre>
            <button
              type="button"
              className="admin-btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
              onClick={() => {
                navigator.clipboard.writeText(sqlCreateScript);
                setCopyStatus(true);
                setTimeout(() => setCopyStatus(false), 2000);
              }}
            >
              {copyStatus ? '✓ Copied SQL!' : 'Copy SQL to Clipboard'}
            </button>
          </div>
        )}

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
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={`shimmer-${idx}`}>
                    <td><div className="admin-shimmer" style={{ width: '30px', height: '15px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '220px', height: '80px' }}></div></td>
                    <td><div className="admin-shimmer" style={{ width: '60px', height: '24px', borderRadius: '12px' }}></div></td>
                    <td>
                      <div className="admin-shimmer" style={{ display: 'inline-block', width: '30px', height: '30px', marginRight: '5px' }}></div>
                      <div className="admin-shimmer" style={{ display: 'inline-block', width: '30px', height: '30px' }}></div>
                    </td>
                  </tr>
                ))
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '35px', color: '#666' }}>
                    No Banner 2 items found. Click "+ Add Banner 2" to upload.
                  </td>
                </tr>
              ) : (
                banners.map((banner, index) => (
                  <tr key={banner.dbId}>
                    <td style={{ color: '#007bff', width: '50px' }}>{index + 1}</td>
                    <td>
                      <img
                        src={banner.image}
                        alt="Banner 2"
                        className="list-img"
                        style={{ width: '220px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                      />
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
          <div className="admin-modal-content" style={{ maxWidth: '520px' }}>
            <div className="admin-modal-header">
              <h3>{editingBanner ? 'Edit Banner 2' : 'Add Banner 2'}</h3>
              <button className="close-modal-btn" onClick={handleCloseForm}>×</button>
            </div>
            <form onSubmit={handleSaveBanner}>
              <div className="admin-modal-body">
                <div className="form-group">
                  <label>Banner 2 Images (Select Multiple) *</label>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
                    You can select multiple images at once (Hold Ctrl / Shift to pick multiple).
                  </p>

                  <input
                    type="file"
                    accept="image/*"
                    multiple={!editingBanner}
                    onChange={handleFilesChange}
                    required={!formData.image && imageFiles.length === 0}
                  />

                  {/* Multiple image thumbnails preview */}
                  {previewUrls.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: '600', color: '#1A1105', marginBottom: '8px' }}>
                        Selected {previewUrls.length} Image(s):
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '10px',
                        flexWrap: 'wrap',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        padding: '6px',
                        background: '#FAF8F5',
                        borderRadius: '6px',
                        border: '1px solid #E5E7EB'
                      }}>
                        {previewUrls.map((url, idx) => (
                          <div
                            key={idx}
                            style={{
                              position: 'relative',
                              width: '95px',
                              height: '55px',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              border: '1.5px solid #D4AF37',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                            }}
                          >
                            <img
                              src={url}
                              alt={`preview-${idx}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <span style={{
                              position: 'absolute',
                              bottom: '2px',
                              right: '4px',
                              background: 'rgba(0,0,0,0.6)',
                              color: '#FFF',
                              fontSize: '10px',
                              padding: '1px 4px',
                              borderRadius: '3px'
                            }}>
                              #{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.image && imageFiles.length === 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontSize: '0.82rem', color: '#666', margin: '0 0 6px 0' }}>Current Image:</p>
                      <img
                        src={formData.image}
                        alt="preview"
                        style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                    </div>
                  )}

                  {uploadProgress && (
                    <div style={{
                      marginTop: '12px',
                      padding: '8px 12px',
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      borderRadius: '6px',
                      color: '#1D4ED8',
                      fontSize: '0.88rem',
                      fontWeight: '600'
                    }}>
                      ⏳ {uploadProgress}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => dispatch(setFormData({ status: e.target.value }))}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseForm} disabled={isSaving}>
                  Close
                </button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Banner 2'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Banner2Panel;
