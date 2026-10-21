import React, { useState, useEffect } from 'react';
import './CategoryPage.css';
import { getProductsFromSupabase } from '../services/productService';
import { getSubcategoriesFromSupabase, getChildCategories, getCategoryBreadcrumbs } from '../services/subcategoryService';
import { calculateFinalPrice } from '../admin/product/ProductPriceCalculator';
import LoadMoreSection from './LoadMoreSection';

const CategoryPage = ({ liveRates = [] }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [childCategories, setChildCategories] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inputMinPrice, setInputMinPrice] = useState('');
  const [inputMaxPrice, setInputMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('position');
  const [showFilters, setShowFilters] = useState(false);
  const [subcategoryName, setSubcategoryName] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    const fetchCategoryPageData = async () => {
      const pathParts = window.location.pathname.split('/');
      const urlName = decodeURIComponent(pathParts[pathParts.length - 1] || '');
      setSubcategoryName(urlName);

      if (!urlName) {
        setLoading(false);
        return;
      }

      // 1. Fetch subcategory data to find current ID and child categories
      const { data: allSubcats } = await getSubcategoriesFromSupabase(null, true);
      let matchedSubcat = null;

      if (allSubcats && allSubcats.length > 0) {
        matchedSubcat = allSubcats.find(
          s => s.name && s.name.toLowerCase() === urlName.toLowerCase()
        );

        if (matchedSubcat) {
          // Fetch child categories for this subcategory
          const { data: children } = await getChildCategories(matchedSubcat.dbId, true);
          setChildCategories(children || []);

          // Fetch breadcrumb hierarchy
          const { data: crumbs } = await getCategoryBreadcrumbs(matchedSubcat.dbId);
          setBreadcrumbs(crumbs || []);
        } else {
          setChildCategories([]);
          setBreadcrumbs([]);
        }
      }

      // 2. Fetch products directly assigned to this subcategory
      const { data: allProducts } = await getProductsFromSupabase(true);
      if (allProducts) {
        const matchingProducts = allProducts.filter(p => {
          if (matchedSubcat) {
            return p.subcategoryId === matchedSubcat.dbId;
          }
          return p.subcategoryName && p.subcategoryName.toLowerCase() === urlName.toLowerCase();
        });
        setProducts(matchingProducts);
        setFilteredProducts(matchingProducts);
      }

      const hasShimmered = sessionStorage.getItem(`catShimmer_${urlName}`);
      if (hasShimmered) {
        setLoading(false);
      } else {
        setTimeout(() => {
          setLoading(false);
          sessionStorage.setItem(`catShimmer_${urlName}`, 'true');
        }, 800);
      }
    };

    fetchCategoryPageData();
  }, []);

  useEffect(() => {
    let result = [...products];

    if (minPrice !== '' || maxPrice !== '') {
      const min = parseFloat(minPrice) || 0;
      const max = parseFloat(maxPrice) || Infinity;

      result = result.filter(p => {
        const { finalPrice } = calculateFinalPrice(p, liveRates);
        return finalPrice >= min && finalPrice <= max;
      });
    }

    if (sortBy === 'price-low-high') {
      result.sort((a, b) => {
        const priceA = calculateFinalPrice(a, liveRates).finalPrice || 0;
        const priceB = calculateFinalPrice(b, liveRates).finalPrice || 0;
        return priceA - priceB;
      });
    } else if (sortBy === 'price-high-low') {
      result.sort((a, b) => {
        const priceA = calculateFinalPrice(a, liveRates).finalPrice || 0;
        const priceB = calculateFinalPrice(b, liveRates).finalPrice || 0;
        return priceB - priceA;
      });
    } else if (sortBy === 'position') {
      result.sort((a, b) => (a.position || 0) - (b.position || 0));
    }

    setFilteredProducts(result);
    setVisibleCount(12);
  }, [minPrice, maxPrice, sortBy, products, liveRates]);

  const handlePriceFilter = (e) => {
    e.preventDefault();
    setMinPrice(inputMinPrice);
    setMaxPrice(inputMaxPrice);
  };

  return (
    <div className="category-page-container animate-fade-in" style={{ paddingTop: '20px' }}>
      {/* Breadcrumbs Navigation */}
      <div className="container category-breadcrumbs" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', fontSize: '0.95rem', color: '#4a0a1f', fontWeight: '500', letterSpacing: '0.5px', flexWrap: 'wrap', gap: '6px' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', color: '#4a0a1f', textDecoration: 'none', cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </a>

        {breadcrumbs.length > 0 ? (
          breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id || idx}>
              <span style={{ color: '#888' }}>&gt;</span>
              {idx === breadcrumbs.length - 1 ? (
                <span style={{ textTransform: 'uppercase', fontWeight: '700', color: '#4a0a1f' }}>{crumb.name}</span>
              ) : crumb.isMainCategory ? (
                <span style={{ textTransform: 'uppercase', color: '#666' }}>{crumb.name}</span>
              ) : (
                <a href={`/subcategory/${encodeURIComponent(crumb.name)}`} style={{ textTransform: 'uppercase', color: '#4a0a1f', textDecoration: 'none' }}>
                  {crumb.name}
                </a>
              )}
            </React.Fragment>
          ))
        ) : (
          <>
            <span style={{ margin: '0 6px', color: '#4a0a1f' }}>&gt;</span>
            <span style={{ textTransform: 'uppercase' }}>{subcategoryName}</span>
          </>
        )}
      </div>

      {/* Mobile Show Filters Bar */}
      <div className="container mobile-filter-bar-wrapper">
        <button
          type="button"
          className="mobile-filter-bar-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          <span className="mobile-filter-icon">☰</span>
        </button>
      </div>

      {/* SECTION 2: PRODUCTS SECTION */}
      <div className="container category-page-layout">
        <aside className={`category-sidebar ${showFilters ? 'mobile-visible' : ''}`}>
          <div className="filter-block">
            <h3 className="filter-title">PRICE</h3>
            <div className="price-range-label">
              ₹ {minPrice || '0'} - ₹ {maxPrice || 'Any'}
            </div>
            <form onSubmit={handlePriceFilter} className="price-filter-form">
              <input
                type="number"
                placeholder="Min"
                value={inputMinPrice}
                onChange={e => setInputMinPrice(e.target.value)}
              />
              <span className="price-separator">-</span>
              <input
                type="number"
                placeholder="Max"
                value={inputMaxPrice}
                onChange={e => setInputMaxPrice(e.target.value)}
              />
              <button type="submit" className="price-go-btn">Go</button>
            </form>
          </div>
        </aside>

        <main className="category-main-content">
        
          {childCategories.length > 0 && (
            <div className="category-child-cards-section">
              <div className="shop-by-category-header">
                <div className="header-line"></div>
                <span className="header-diamond">◆</span>
                <h3 className="shop-by-category-title">SHOP BY CATEGORY</h3>
                <span className="header-diamond">◆</span>
                <div className="header-line"></div>
              </div>

              <div className="category-child-grid">
                {childCategories.map(child => (
                  <div 
                    key={child.id} 
                    className="child-card-wrapper"
                    onClick={() => {
                      window.location.href = `/subcategory/${encodeURIComponent(child.name)}`;
                    }}
                  >
                    <div className="child-card-img-box">
                      {child.image ? (
                        <img 
                          src={child.image} 
                          alt={child.name} 
                          loading="lazy"
                          onError={(e) => { 
                            e.target.style.display = 'none'; 
                          }}
                        />
                      ) : (
                        <div className="child-card-fallback">
                          <span>{child.name?.charAt(0)?.toUpperCase() || 'J'}</span>
                        </div>
                      )}
                    </div>
                    <div className="child-card-meta">
                      <h4 className="child-card-title">{child.name}</h4>
                      <span className="child-card-explore">
                        Explore Now <span className="explore-arrow">→</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="category-toolbar">
            <div className="sort-box">
              <label>Sort by:</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="position">Position</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
              </select>
            </div>
            <div className="items-count">
              Showing {filteredProducts.length} of {products.length} products directly in <strong>{subcategoryName}</strong>
            </div>
          </div>

          {loading ? (
            <div className="products-grid">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={`shimmer-cat-${idx}`} className="product-card" style={{ height: '400px' }}>
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
            <div className="no-products-found" style={{ padding: '50px 0', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>💎</div>
              <h3 style={{ color: '#4a0a1f' }}>No products directly listed in {subcategoryName}</h3>
              {childCategories.length > 0 && (
                <p style={{ color: '#666', marginTop: '8px' }}>
                  Please explore the Child Collections above to see related jewellery items.
                </p>
              )}
              {(minPrice || maxPrice) && (
                <button className="btn-gold" onClick={() => { setMinPrice(''); setMaxPrice(''); setInputMinPrice(''); setInputMaxPrice(''); }} style={{ marginTop: '20px' }}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="products-grid">
                {filteredProducts.slice(0, visibleCount).map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="product-img-wrapper">
                      <img src={product.image} alt={product.name} loading="lazy" />
                      {product.badge && <span className="product-badge">{product.badge}</span>}

                      <button className="quick-view-hover-btn" onClick={() => { window.location.href = `/product/${encodeURIComponent(product.name.toLowerCase())}`; }}>
                        Quick View
                      </button>
                    </div>

                    <div className="product-info-box">
                      <h3 className="product-title" onClick={() => { window.location.href = `/product/${encodeURIComponent(product.name.toLowerCase())}` }} style={{ marginBottom: '8px', color: '#001a33', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: "'Times New Roman', Times, serif" }}>
                        {product.name}
                      </h3>

                      <div className="product-weight-purity" style={{ marginBottom: '12px', color: '#003366', fontSize: '0.9rem', fontFamily: "'Times New Roman', Times, serif" }}>
                        Weight: {product.netWeight > 0 ? `${product.netWeight}g` : '-'} • {product.purity || '-'}
                      </div>

                      {(() => {
                        const { finalPrice } = calculateFinalPrice(product, liveRates);
                        if (finalPrice > 0) {
                          return (
                            <div style={{ color: '#000', fontWeight: 'bold', fontSize: '1.4rem', marginBottom: '15px', fontFamily: "'Times New Roman', Times, serif" }}>
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
                        marginTop: 'auto',
                        fontFamily: "'Times New Roman', Times, serif"
                      }}
                    >
                      VIEW PRODUCT
                    </button>
                  </div>
                ))}
              </div>

              <LoadMoreSection
                currentCount={Math.min(visibleCount, filteredProducts.length)}
                totalCount={filteredProducts.length}
                onLoadMore={() => setVisibleCount((prev) => prev + 12)}
                step={12}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default CategoryPage;
