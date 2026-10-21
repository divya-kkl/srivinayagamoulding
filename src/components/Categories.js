import React, { useState, useEffect } from 'react';
import './Categories.css';
import { getSubcategoriesFromSupabase } from '../services/subcategoryService';

const Categories = ({ activeCategory, onSelectCategory, onSelectSubcategory }) => {
  const [dynamicSubcats, setDynamicSubcats] = useState([]);
  const [isLoadingSubcats, setIsLoadingSubcats] = useState(true);

  useEffect(() => {
    const fetchSubcats = async () => {
      setIsLoadingSubcats(true);
      const catId = activeCategory === 'all' ? null : activeCategory;
      const { data } = await getSubcategoriesFromSupabase(catId, true);
      if (data) {
        // Only show Main Subcategories (Level 1), hide Child categories
        const mainSubcategories = data.filter(s => !s.subcategoryId);
        setDynamicSubcats(mainSubcategories);
      }

      const hasShimmered = sessionStorage.getItem('appShimmerDone');
      if (hasShimmered) {
        setIsLoadingSubcats(false);
      } else {
        setTimeout(() => {
          setIsLoadingSubcats(false);
        }, 1500);
      }
    };
    fetchSubcats();
  }, [activeCategory]);

  return (
    <section className="categories-section">
      <div className="container">
        <div className="section-header text-center">
          <span className="section-subtitle brand-font">ROYAL SELECTIONS</span>
          <h2 className="section-title">Explore by Subcategory</h2>
          <div className="gold-divider"></div>
        </div>

        <div className="categories-grid">
          {isLoadingSubcats ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={`shimmer-${idx}`} className="category-card shimmer-card">
                <div className="category-img-frame cat-shimmer" style={{ background: '#f0f0f0' }}></div>
                <div className="cat-shimmer" style={{ width: '100px', height: '20px', margin: '15px auto 6px', borderRadius: '4px' }}></div>
                <div className="cat-shimmer" style={{ width: '65px', height: '14px', margin: '0 auto', borderRadius: '4px' }}></div>
              </div>
            ))
          ) : (
            dynamicSubcats.map((subcat) => (
              <div
                key={subcat.id}
                className={`category-card ${activeCategory === subcat.id ? 'active' : ''}`}
                onClick={() => {
                  if (typeof onSelectSubcategory === 'function') {
                    onSelectSubcategory(subcat);
                  } else if (typeof onSelectCategory === 'function') {
                    onSelectCategory(subcat.id);
                  } else {
                    window.location.href = `/subcategory/${encodeURIComponent((subcat.name || '').toLowerCase())}`;
                  }
                }}
              >
                <div className="category-img-frame">
                  <img src={subcat.image} alt={subcat.name} loading="lazy" />
                  <span className="category-tag-badge">{subcat.categoryName}</span>
                </div>
                <h3 className="category-name">{subcat.name}</h3>
                <span className="category-count">{subcat.description || ''}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Categories;
