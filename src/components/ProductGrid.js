import React, { useState, useEffect } from 'react';
import './ProductGrid.css';
import { supabase } from '../supabaseClient';
import { getProductsFromSupabase } from '../services/productService';
import { getTagsFromSupabase } from '../services/tagService';
import { calculateFinalPrice, getProductWeightDisplay } from '../admin/product/ProductPriceCalculator';
import { doesProductMatchQuery } from '../utils/tamilSearchHelper';

const ProductGrid = ({
  title = 'Featured Jewellery',
  subtitle = 'EXQUISITE CRAFTSMANSHIP',
  targetTag = null,
  sectionId = 'featured-products',
  activeCategory,
  onSelectCategory,
  searchQuery,
  wishlist,
  onToggleWishlist,
  onQuickView,
  liveRates = []
}) => {
  const [filterTab, setFilterTab] = useState('all');
  const [tags, setTags] = useState([]);
  const [dynamicProducts, setDynamicProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const fetchData = async () => {
    setIsLoadingProducts(true);
    const prodRes = await getProductsFromSupabase(true);
    if (prodRes.data) setDynamicProducts(prodRes.data);

    const tagRes = await getTagsFromSupabase(true);
    if (tagRes.data) setTags(tagRes.data);

    const hasShimmered = sessionStorage.getItem('appShimmerDone');
    if (hasShimmered) {
      setIsLoadingProducts(false);
    } else {
      setTimeout(() => {
        setIsLoadingProducts(false);
      }, 1200);
    }
  };

  useEffect(() => {
    fetchData();

    // Supabase Realtime Listener: Automatically refresh when tags or products are updated in Admin
    const subscription = supabase
      .channel(`product_grid_${sectionId}_realtime`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tags' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [sectionId]);

  // Find matching tag object from Supabase (by name, code, or dbId)
  const activeTargetTagObj = targetTag
    ? tags.find(
        t =>
          (t.name && t.name.toLowerCase().trim() === targetTag.toLowerCase().trim()) ||
          t.dbId === targetTag ||
          t.id === targetTag ||
          (t.name && targetTag.toLowerCase().includes(t.name.toLowerCase())) ||
          (t.name && t.name.toLowerCase().includes(targetTag.toLowerCase()))
      )
    : null;

  // Filter products by tag and search
  const filteredProducts = dynamicProducts.filter((item) => {
    if (targetTag) {
      const targetLower = targetTag.toLowerCase().trim();
      const itemTagNameLower = (item.tagName || '').toLowerCase().trim();
      const isTagMatch =
        (activeTargetTagObj && item.tagId === activeTargetTagObj.dbId) ||
        (activeTargetTagObj && item.tagId === activeTargetTagObj.id) ||
        item.tagId === targetTag ||
        itemTagNameLower === targetLower ||
        itemTagNameLower.includes(targetLower) ||
        targetLower.includes(itemTagNameLower);

      if (!isTagMatch) return false;
    } else {
      if (!item.tagId && !item.tagName) return false;
    }

    if (activeCategory !== 'all' && activeCategory !== 'scheme') {
      if (item.categoryId !== activeCategory) return false;
    }

    if (filterTab !== 'all') {
      if (item.tagId !== filterTab && item.tagName !== filterTab) return false;
    }

    if (searchQuery) {
      return doesProductMatchQuery(item, searchQuery);
    }
    return true;
  });

  // Home page displays 4 products in the row
  const displayedProducts = filteredProducts.slice(0, 4);

  // Dynamic Section Title: uses live tag name from Supabase if available
  const displayTitle = activeTargetTagObj?.name || title;

  const handleViewAllNavigation = () => {
    if (activeTargetTagObj) {
      window.location.href = `/tag/${encodeURIComponent(activeTargetTagObj.name.toLowerCase())}`;
    } else if (targetTag) {
      window.location.href = `/tag/${encodeURIComponent(targetTag.toLowerCase())}`;
    } else {
      window.location.href = '/featured';
    }
  };

  return (
    <section className="product-grid-section" id={sectionId}>
      <div className="container">
        <div className="section-header text-center">
          <span className="section-subtitle brand-font">{subtitle}</span>
          <h2 className="section-title">{displayTitle}</h2>
          <div className="gold-divider"></div>
        </div>

        {/* Top-Right "VIEW ALL" Text Content Link */}
        {!isLoadingProducts && filteredProducts.length > 0 && (
          <div className="product-grid-top-actions">
            <span
              className="view-all-text-link"
              onClick={handleViewAllNavigation}
              role="button"
              tabIndex={0}
            >
              VIEW ALL <span className="view-all-arrow">→</span>
            </span>
          </div>
        )}

        {isLoadingProducts ? (
          <div className="products-grid">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={`shimmer-prod-${idx}`} className="product-card" style={{ height: '400px' }}>
                <div className="product-shimmer" style={{ width: '100%', height: '240px', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}></div>
                <div className="product-info-box">
                  <div className="product-shimmer" style={{ width: '80%', height: '20px', marginBottom: '12px', borderRadius: '4px' }}></div>
                  <div className="product-shimmer" style={{ width: '60%', height: '14px', marginBottom: '16px', borderRadius: '4px' }}></div>
                  <div className="product-shimmer" style={{ width: '40%', height: '24px', borderRadius: '4px' }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="no-products-found">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <h3>No jewellery items found for {displayTitle}.</h3>
            <p>Add products with the "{displayTitle}" tag in Admin Panel to display them here.</p>
            <button className="btn-gold" onClick={() => { if (typeof onSelectCategory === 'function') onSelectCategory('all'); setFilterTab('all'); }}>
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {displayedProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div
                  className="product-img-wrapper"
                  onClick={() => {
                    if (onQuickView) {
                      onQuickView(product);
                    } else {
                      window.location.href = `/product/${encodeURIComponent(product.name.toLowerCase())}`;
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                  title={`Click to view ${product.name}`}
                >
                  <img src={product.image} alt={product.name} loading="lazy" />
                </div>

                <div className="product-info-box">
                  <h3
                    className="product-title"
                    onClick={() => { window.location.href = `/product/${encodeURIComponent(product.name.toLowerCase())}`; }}
                    style={{ marginBottom: '8px', color: '#001a33', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    {product.name} {product.productCode && <span style={{ display: 'none' }}>#{product.productCode}</span>}
                  </h3>

                  <div className="product-weight-purity" style={{ marginBottom: '12px', color: '#003366', fontSize: '0.9rem' }}>
                    {getProductWeightDisplay(product)} • {product.purity ? product.purity.replace(/\s*gold/i, '').trim() || '22K' : '22K'}
                  </div>

                  {(() => {
                    const { finalPrice } = calculateFinalPrice(product, liveRates);
                    if (finalPrice > 0) {
                      return (
                        <div style={{ color: '#000', fontWeight: 'bold', fontSize: '1.4rem', marginBottom: '15px' }}>
                          ₹{finalPrice.toLocaleString('en-IN')}
                        </div>
                      );
                    }
                    return <div style={{ marginBottom: '15px' }}>&nbsp;</div>;
                  })()}
                </div>

                <button
                  className="view-product-btn"
                  onClick={() => {
                    window.location.href = `/product/${encodeURIComponent(product.name.toLowerCase())}`;
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--primary-green, #003B2F)',
                    color: 'white',
                    border: 'none',
                    padding: '14px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    borderRadius: '0 0 10px 10px'
                  }}
                >
                  VIEW PRODUCT
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;
