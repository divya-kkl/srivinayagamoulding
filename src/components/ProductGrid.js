import React, { useState, useEffect } from 'react';
import './ProductGrid.css';
import { getProductsFromSupabase } from '../services/productService';
import { getTagsFromSupabase } from '../services/tagService';
import { calculateFinalPrice } from '../admin/product/ProductPriceCalculator';

const ProductGrid = ({
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

  useEffect(() => {
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
        }, 1500);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = dynamicProducts.filter((item) => {
    if (!item.tagId && !item.tagName) return false;

    if (activeCategory !== 'all' && activeCategory !== 'scheme') {
      if (item.categoryId !== activeCategory) return false;
    }

    if (filterTab !== 'all') {
      if (item.tagId !== filterTab) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      return (
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.productCode && item.productCode.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Home page displays only 4 products
  const displayedProducts = filteredProducts.slice(0, 4);

  const handleViewAllNavigation = () => {
    if (filterTab !== 'all') {
      const activeTagObj = tags.find(t => (t.dbId || t.id) === filterTab);
      const targetUrl = activeTagObj ? `/tag/${encodeURIComponent(activeTagObj.name.toLowerCase())}` : '/featured';
      window.location.href = targetUrl;
    } else {
      window.location.href = '/featured';
    }
  };

  return (
    <section className="product-grid-section" id="featured-products">
      <div className="container">
        <div className="section-header text-center">
          <span className="section-subtitle brand-font">EXQUISITE CRAFTSMANSHIP</span>
          <h2 className="section-title">Featured Jewellery</h2>
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
            <h3>No jewellery items match your search.</h3>
            <p>Try selecting a different category or tag.</p>
            <button className="btn-gold" onClick={() => { if (typeof onSelectCategory === 'function') onSelectCategory('all'); setFilterTab('all'); }}>
              Reset All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="products-grid">
              {displayedProducts.map((product) => (
                <div key={product.id} className="product-card">
                  <div className="product-img-wrapper">
                    <img src={product.image} alt={product.name} loading="lazy" />

                    {product.badge && <span className="product-badge">{product.badge}</span>}

                    <button className="quick-view-hover-btn" onClick={() => onQuickView(product)}>
                      Quick View
                    </button>
                  </div>

                  <div className="product-info-box">
                    <h3 className="product-title" onClick={() => { window.location.href = `/product/${encodeURIComponent(product.name.toLowerCase())}` }} style={{ marginBottom: '8px', color: '#001a33', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}>
                      {product.name} {product.productCode && <span style={{ display: 'none' }}>#{product.productCode}</span>}
                    </h3>

                    <div className="product-weight-purity" style={{ marginBottom: '12px', color: '#003366', fontSize: '0.9rem' }}>
                      Weight: {product.netWeight > 0 ? `${product.netWeight}g` : '-'} • {product.purity || '-'}
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
                      backgroundColor: '#4a0a1f',
                      color: 'white',
                      border: 'none',
                      padding: '14px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 'bold',
                      letterSpacing: '1px',
                      cursor: 'pointer',
                      marginTop: 'auto'
                    }}
                  >
                    VIEW PRODUCT
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;

