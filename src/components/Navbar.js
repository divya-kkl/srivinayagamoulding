import React, { useState, useEffect, useRef } from 'react';
import './Navbar.css';
import { getCategoriesFromSupabase } from '../services/categoryService';
import { getSubcategoriesFromSupabase } from '../services/subcategoryService';
import { searchProductsInSupabase } from '../services/productService';
import { calculateFinalPrice } from '../admin/product/ProductPriceCalculator';

const Navbar = ({
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenCalculator,
  logoUrl,
  shopName = 'GOD JEWELLERY',
  isLoadingSettings,
  liveRates = []
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [dynamicSubcategories, setDynamicSubcategories] = useState([]);
  const [isLoadingCats, setIsLoadingCats] = useState(true);

  // Live Search States
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchBarRef = useRef(null);

  // Detect window scroll on all pages to shrink navbar smoothly
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0;
      setIsScrolled(scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target)) {
        setIsSearchDropdownOpen(false);
      }
      if (!e.target.closest('.nav-dropdown-container')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search results with 250ms debounce
  useEffect(() => {
    if (!searchQuery || !searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchDropdownOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setIsSearchDropdownOpen(true);

    const timer = setTimeout(async () => {
      const { data } = await searchProductsInSupabase(searchQuery);
      setSearchResults(data || []);
      setIsSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await getCategoriesFromSupabase(true);
      if (data) setDynamicCategories(data);

      const subcatRes = await getSubcategoriesFromSupabase();
      if (subcatRes.data) {

        setDynamicSubcategories(subcatRes.data.filter(s => s.status === 'ACTIVE'));
      }

      const hasShimmered = sessionStorage.getItem('appShimmerDone');
      if (hasShimmered) {
        setIsLoadingCats(false);
      } else {
        setTimeout(() => {
          setIsLoadingCats(false);
        }, 1500);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    if (window.location.pathname.startsWith('/subcategory/')) {
      const pathParts = window.location.pathname.split('/');
      const subName = decodeURIComponent(pathParts[pathParts.length - 1] || '').toLowerCase();
      const matchedSub = dynamicSubcategories.find(s => s.name?.toLowerCase() === subName);
      if (matchedSub && matchedSub.categoryId) {
        setActiveCategory(matchedSub.categoryId);
      }
    }
  }, [dynamicSubcategories, setActiveCategory]);

  const navLinks = [
    { id: 'all', label: 'Home' },
    ...dynamicCategories.map(cat => ({ id: cat.id, label: cat.name })),
  ];

  const [activeDrawerTab, setActiveDrawerTab] = useState('menu');
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategoryExpand = (catId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  return (
    <header className={`main-navbar-header ${isScrolled ? 'scrolled-compact' : ''}`}>
      <div className="container nav-main-container">

        <button
          className="mobile-hamburger-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isMobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>

        <div className="brand-logo-wrapper" onClick={() => { setActiveCategory('all'); if (window.location.pathname !== '/') window.location.href = '/'; }} style={{ cursor: 'pointer' }}>
          {logoUrl ? (
            <img src={logoUrl} alt={shopName} style={{ maxHeight: '45px', objectFit: 'contain', marginRight: '10px' }} />
          ) : (
            <div className="brand-emblem">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#goldGradient)" strokeWidth="1.5">
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFE082" />
                    <stop offset="50%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#9E7412" />
                  </linearGradient>
                </defs>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
          )}
          <div className="brand-text">
            {isLoadingSettings ? (
              <>
                <div className="nav-shimmer" style={{ width: '150px', height: '24px', marginBottom: '4px', borderRadius: '4px' }}></div>
                <div className="nav-shimmer brand-subtitle-shimmer" style={{ width: '180px', height: '12px', borderRadius: '4px' }}></div>
              </>
            ) : (
              <>
                <span className="brand-title brand-font">{shopName?.toUpperCase() || ''}</span>
                <span className="brand-subtitle">EXQUISITE GOLD & DIAMONDS</span>
              </>
            )}
          </div>
        </div>

        <div className="nav-search-bar" ref={searchBarRef}>
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by product name..."
            value={searchQuery}
            onFocus={() => {
              if (searchQuery.trim()) setIsSearchDropdownOpen(true);
            }}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                setIsSearchDropdownOpen(false);
                window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
              } else if (e.key === 'Escape') {
                setIsSearchDropdownOpen(false);
              }
            }}
          />
          {isSearching && (
            <div className="search-loading-spinner" title="Searching Supabase..."></div>
          )}
          {searchQuery && !isSearching && (
            <button
              className="clear-search-btn"
              onClick={() => {
                setSearchQuery('');
                setIsSearchDropdownOpen(false);
              }}
            >
              ×
            </button>
          )}

          {/* Live Search Results Dropdown */}
          {isSearchDropdownOpen && searchQuery.trim() && (
            <div className="search-dropdown-menu animate-fade-in">
              <div className="search-dropdown-header">
                <span>
                  {isSearching ? 'Searching Supabase...' : `Found ${searchResults.length} Product${searchResults.length === 1 ? '' : 's'}`}
                </span>
                {searchResults.length > 0 && (
                  <span className="search-dropdown-hint">Press Enter to view all</span>
                )}
              </div>

              {isSearching ? (
                <div className="search-dropdown-loading">
                  <div className="search-item-shimmer"></div>
                  <div className="search-item-shimmer"></div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="search-dropdown-empty">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <p>No jewellery found for <strong>"{searchQuery}"</strong></p>
                  <span className="search-empty-sub">Try searching by jewellery name or category</span>
                </div>
              ) : (
                <>
                  <div className="search-dropdown-list">
                    {searchResults.slice(0, 6).map((item) => {
                      const { finalPrice } = calculateFinalPrice(item, liveRates);
                      return (
                        <div
                          key={item.id}
                          className="search-dropdown-item"
                          onClick={() => {
                            setIsSearchDropdownOpen(false);
                            window.location.href = `/product/${encodeURIComponent(item.name.toLowerCase())}`;
                          }}
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="search-item-thumb"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=Jewel'; }}
                          />
                          <div className="search-item-details">
                            <div className="search-item-title-row">
                              <span className="search-item-title">{item.name}</span>
                            </div>
                            <div className="search-item-sub">
                              {item.categoryName} • {item.purity || '22K'} {(item.netWeight || item.grossWeight || item.weight) ? `• ${item.netWeight || item.grossWeight || item.weight}g` : ''}
                            </div>
                          </div>
                          {finalPrice > 0 && (
                            <div className="search-item-price">
                              ₹{finalPrice.toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div
                    className="search-dropdown-footer"
                    onClick={() => {
                      setIsSearchDropdownOpen(false);
                      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
                    }}
                  >
                    <span>View all {searchResults.length} results</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Desktop Horizontal Category Bar */}
      <nav className="category-nav-bar desktop-only">
        <div className="container nav-links-flex">
          {isLoadingCats ? (
            <>
              <div className="nav-shimmer" style={{ width: '60px', height: '18px', margin: '0.6rem 0' }}></div>
              <div className="nav-shimmer" style={{ width: '80px', height: '18px', margin: '0.6rem 0' }}></div>
              <div className="nav-shimmer" style={{ width: '100px', height: '18px', margin: '0.6rem 0' }}></div>
              <div className="nav-shimmer" style={{ width: '70px', height: '18px', margin: '0.6rem 0' }}></div>
            </>
          ) : (
            navLinks.map((link) => {
              const categorySubcats = dynamicSubcategories.filter(s => s.categoryId === link.id && !s.subcategoryId);
              const hasDropdown = categorySubcats.length > 0;

              const isOpen = openDropdownId === link.id;

              return (
                <div key={link.id} className="nav-dropdown-container">
                  <button
                    className={`nav-category-link ${activeCategory === link.id ? 'active' : ''}`}
                    onClick={(e) => {
                      if (link.id === 'all') {
                        setActiveCategory('all');
                        setOpenDropdownId(null);
                        if (window.location.pathname !== '/') {
                          window.location.href = '/';
                        }
                      } else if (hasDropdown) {
                        e.preventDefault();
                        e.stopPropagation();
                        // ONLY show/toggle subcategory dropdown!
                        setOpenDropdownId(prev => prev === link.id ? null : link.id);
                      } else {
                        window.location.href = `/subcategory/${encodeURIComponent((link.label || '').toLowerCase())}`;
                      }
                    }}
                  >
                    {link.label}
                    {hasDropdown && (
                      <svg className={`nav-dropdown-arrow ${isOpen ? 'rotated' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    )}
                  </button>
                  {hasDropdown && (
                    <div className={`nav-dropdown-menu ${isOpen ? 'open' : ''}`}>
                      {categorySubcats.map(sub => (
                        <div key={sub.dbId} className="nav-dropdown-item" onClick={() => {
                          setActiveCategory(link.id);
                          setOpenDropdownId(null);
                          window.location.href = `/subcategory/${encodeURIComponent(sub.name.toLowerCase())}`;
                        }}>
                          {sub.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </nav>

      {/* Mobile Slide-in Drawer Overlay */}
      <div
        className={`mobile-drawer-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Side Drawer Menu */}
      <aside className={`mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        {/* Top 2 Tabs Header: Menu | Account */}
        <div className="drawer-tabs-header">
          <button
            className={`drawer-tab ${activeDrawerTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveDrawerTab('menu')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span>Menu</span>
          </button>
          <button
            className={`drawer-tab account-tab ${activeDrawerTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveDrawerTab('account')}
          >
            <span>Account</span>
          </button>
        </div>

        {/* Drawer Body Content */}
        {activeDrawerTab === 'menu' ? (
          <div className="drawer-menu-list">
            {/* Home Row */}
            <div className="drawer-item-wrapper">
              <button
                className={`drawer-menu-row ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategory('all');
                  setIsMobileMenuOpen(false);
                  if (window.location.pathname !== '/') {
                    window.location.href = '/';
                  }
                }}
              >
                <span>HOME</span>
              </button>
            </div>

            {/* Dynamic Categories */}
            {dynamicCategories.map((cat) => {
              const categorySubcats = dynamicSubcategories.filter(s => s.categoryId === cat.id && !s.subcategoryId);
              const hasDropdown = categorySubcats.length > 0;
              const isExpanded = !!expandedCategories[cat.id];

              return (
                <div key={cat.id} className="drawer-item-wrapper">
                  <div
                    className={`drawer-menu-row ${activeCategory === cat.id ? 'active' : ''}`}
                    onClick={() => {
                      if (hasDropdown) {
                        toggleCategoryExpand(cat.id);
                      } else {
                        setActiveCategory(cat.id);
                        setIsMobileMenuOpen(false);
                        if (window.location.pathname !== '/') {
                          window.location.href = '/';
                        }
                      }
                    }}
                  >
                    <span>{cat.name.toUpperCase()}</span>
                    {hasDropdown && (
                      <svg
                        className={`drawer-chevron ${isExpanded ? 'rotated' : ''}`}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    )}
                  </div>


                  {hasDropdown && isExpanded && (
                    <div className="drawer-accordion">
                      {categorySubcats.map((sub) => (
                        <button
                          key={sub.dbId}
                          className="drawer-sub-item"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            window.location.href = `/subcategory/${encodeURIComponent(sub.name.toLowerCase())}`;
                          }}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}


            <div className="drawer-item-wrapper">
              <button
                className="drawer-menu-row"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  window.open('https://wa.me/917305555550', '_blank');
                }}
              >
                <span>CONTACT</span>
              </button>
            </div>
          </div>
        ) : (

          <div className="drawer-menu-list">
            <div className="drawer-item-wrapper">
              <button
                className="drawer-menu-row"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  window.location.href = '/admin';
                }}
              >
                <span>ADMIN PANEL</span>
              </button>
            </div>
            <div className="drawer-item-wrapper">
              <button
                className="drawer-menu-row"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  window.open('https://wa.me/917305555550', '_blank');
                }}
              >
                <span>WHATSAPP SUPPORT</span>
              </button>
            </div>
            <div className="drawer-item-wrapper">
              <button
                className="drawer-menu-row"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  window.location.href = 'tel:9843172314';
                }}
              >
                <span>CALL SHOWROOM</span>
              </button>
            </div>
          </div>
        )}
      </aside>
    </header>
  );
};

export default Navbar;

