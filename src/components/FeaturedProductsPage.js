import React, { useState, useEffect } from 'react';
import './CategoryPage.css';
import { getProductsFromSupabase } from '../services/productService';
import { getTagsFromSupabase } from '../services/tagService';
import { calculateFinalPrice } from '../admin/product/ProductPriceCalculator';
import LoadMoreSection from './LoadMoreSection';
import SortDropdown from './SortDropdown';

const FeaturedProductsPage = ({ liveRates = [] }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tagTitle, setTagTitle] = useState('Featured Jewellery');

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inputMinPrice, setInputMinPrice] = useState('');
  const [inputMaxPrice, setInputMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('position');
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    const fetchTaggedProducts = async () => {
      setLoading(true);
      const pathname = window.location.pathname;
      let targetTagName = '';

      if (pathname.startsWith('/tag/')) {
        const parts = pathname.split('/');
        targetTagName = decodeURIComponent(parts[parts.length - 1] || '').trim();
      } else {
        const params = new URLSearchParams(window.location.search);
        targetTagName = params.get('tag') || '';
      }

      const { data: allProducts } = await getProductsFromSupabase(true);
      const { data: allTags } = await getTagsFromSupabase(true);

      if (allProducts) {
        let matched = [];
        if (targetTagName) {
          // Find tag by name or ID
          const matchedTag = allTags?.find(
            t => t.name?.toLowerCase() === targetTagName.toLowerCase() || t.dbId === targetTagName
          );

          setTagTitle(matchedTag ? `${matchedTag.name} Collection` : `${targetTagName.toUpperCase()} Jewellery`);

          matched = allProducts.filter(p => {
            if (matchedTag) {
              return p.tagId === matchedTag.dbId || (p.tagName && p.tagName.toLowerCase() === matchedTag.name.toLowerCase());
            }
            return (p.tagName && p.tagName.toLowerCase() === targetTagName.toLowerCase()) || p.tagId === targetTagName;
          });
        } else {
          setTagTitle('All Jewellery Collections');
          // Show all products when viewing all-products or favorites
          matched = allProducts;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const urlMin = urlParams.get('min');
        const urlMax = urlParams.get('max');
        if (urlMin) {
          setMinPrice(urlMin);
          setInputMinPrice(urlMin);
        }
        if (urlMax) {
          setMaxPrice(urlMax);
          setInputMaxPrice(urlMax);
        }

        setProducts(matched);
        setFilteredProducts(matched);
      }

      setLoading(false);
    };

    fetchTaggedProducts();
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

  const handleClearPriceFilter = () => {
    setInputMinPrice('');
    setInputMaxPrice('');
    setMinPrice('');
    setMaxPrice('');
  };

  return (
    <div className="category-page-container animate-fade-in" style={{ paddingTop: '20px' }}>
      {/* Breadcrumbs Navigation */}
      <div className="container category-breadcrumbs" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', fontSize: '0.95rem', color: '#4a0a1f', fontWeight: '500', letterSpacing: '0.5px' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', color: '#4a0a1f', textDecoration: 'none', cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </a>
        <span style={{ margin: '0 10px', color: '#888' }}>&gt;</span>
        <span style={{ textTransform: 'uppercase', fontWeight: '700', color: '#4a0a1f' }}>{tagTitle}</span>
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

      <div className="container category-page-layout">
        {/* Left Filter Sidebar */}
        <aside className={`category-sidebar ${showFilters ? 'mobile-visible' : ''}`}>
          <div className="filter-block">
            <div className="filter-title-row">
              <h3 className="filter-title">PRICE</h3>
              {(minPrice !== '' || maxPrice !== '' || inputMinPrice !== '' || inputMaxPrice !== '') && (
                <button
                  type="button"
                  onClick={handleClearPriceFilter}
                  className="price-simple-x-btn"
                  title="Clear Price Filter"
                  aria-label="Clear Price Filter"
                >
                  ✕
                </button>
              )}
            </div>
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

        {/* Main Content Area */}
        <main className="category-main-content">
          <div className="category-toolbar">
            <div className="sort-box">
              <label>Sort by:</label>
              <SortDropdown value={sortBy} onChange={setSortBy} />
            </div>
            <div className="items-count">
              Showing {filteredProducts.length} of {products.length} products
            </div>
          </div>

          {(minPrice !== '' || maxPrice !== '') && (
            <div className="active-filter-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '16px', background: '#FFFDF5', border: '1px solid #E2D6BE', padding: '8px 14px', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.86rem', color: '#444' }}>
                Applied Price Filter: <strong style={{ color: '#4a0a1f' }}>₹{minPrice || '0'} - ₹{maxPrice || 'Any'}</strong> ({filteredProducts.length} items found)
              </span>
              <button
                type="button"
                onClick={handleClearPriceFilter}
                style={{ background: '#4A0E17', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Remove Filter"
              >
                ✕ Remove Filter
              </button>
            </div>
          )}

          {loading ? (
            <div className="products-grid">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={`shimmer-tag-${idx}`} className="product-card" style={{ height: '400px' }}>
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
              <h3>No products found in this collection.</h3>
              <button className="btn-gold" onClick={() => { window.location.href = '/'; }} style={{ marginTop: '20px' }}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <div className="products-grid">
                {filteredProducts.slice(0, visibleCount).map((product) => (
                  <div key={product.id} className="product-card">
                    <div
                      className="product-img-wrapper"
                      onClick={() => {
                        window.location.href = `/product/${encodeURIComponent(product.name.toLowerCase())}`;
                      }}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                      title={`Click to view ${product.name}`}
                    >
                      <img src={product.image} alt={product.name} loading="lazy" />
                      {product.badge && <span className="product-badge">{product.badge}</span>}
                    </div>

                    <div className="product-info-box">
                      <h3
                        className="product-title"
                        onClick={() => {
                          window.location.href = `/product/${encodeURIComponent(product.name.toLowerCase())}`;
                        }}
                        style={{ marginBottom: '8px', color: '#001a33', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        {product.name}
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

              <LoadMoreSection
                currentCount={Math.min(visibleCount, filteredProducts.length)}
                totalCount={filteredProducts.length}
                onLoadMore={() => setVisibleCount(prev => prev + 12)}
                step={12}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default FeaturedProductsPage;
