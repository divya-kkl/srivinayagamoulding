import React, { useState, useEffect } from 'react';
import './CategoryPage.css';
import { searchProductsInSupabase } from '../services/productService';
import { calculateFinalPrice } from '../admin/product/ProductPriceCalculator';
import LoadMoreSection from './LoadMoreSection';

const SearchPage = ({ liveRates = [] }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inputMinPrice, setInputMinPrice] = useState('');
  const [inputMaxPrice, setInputMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('position');
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    const fetchSearchResults = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const q = urlParams.get('q') || '';
      setSearchQuery(q);

      if (!q.trim()) {
        setProducts([]);
        setFilteredProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data } = await searchProductsInSupabase(q);

      if (data) {
        setProducts(data);
        setFilteredProducts(data);
      }
      setLoading(false);
    };

    fetchSearchResults();
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
      <div className="container category-breadcrumbs" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', fontSize: '0.95rem', color: '#4a0a1f', fontWeight: '500', letterSpacing: '0.5px' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', color: '#4a0a1f', textDecoration: 'none', cursor: 'pointer', transition: 'color 0.2s' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </a>
        <span style={{ margin: '0 12px', color: '#4a0a1f' }}>&gt;</span>
        <span>SEARCH RESULTS FOR "{searchQuery}"</span>
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
              Found {filteredProducts.length} products
            </div>
          </div>

          {loading ? (
            <div className="products-grid">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={`shimmer-search-${idx}`} className="product-card" style={{ height: '400px' }}>
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
              <h3>No products found for "{searchQuery}".</h3>
              <button className="btn-gold" onClick={() => window.location.href = '/'} style={{ marginTop: '20px' }}>
                Continue Shopping
              </button>
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

export default SearchPage;
