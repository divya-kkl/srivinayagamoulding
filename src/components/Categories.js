import React, { useState, useEffect, useRef } from 'react';
import './Categories.css';
import { getSubcategoriesFromSupabase } from '../services/subcategoryService';

const Categories = ({ activeCategory, onSelectCategory, onSelectSubcategory }) => {
  const [dynamicSubcats, setDynamicSubcats] = useState([]);
  const [isLoadingSubcats, setIsLoadingSubcats] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchSubcats = async () => {
      setIsLoadingSubcats(true);
      const catId = activeCategory === 'all' ? null : activeCategory;
      const { data } = await getSubcategoriesFromSupabase(catId, true);
      if (data) {
        // Only show Main Subcategories (Level 1), hide Child categories
        const mainSubcategories = data.filter((s) => !s.subcategoryId);
        setDynamicSubcats(mainSubcategories);
      }

      const hasShimmered = sessionStorage.getItem('appShimmerDone');
      if (hasShimmered) {
        setIsLoadingSubcats(false);
      } else {
        setTimeout(() => {
          setIsLoadingSubcats(false);
        }, 1200);
      }
    };
    fetchSubcats();
  }, [activeCategory]);

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const card = container.querySelector('.category-tile-card');
    const cardWidth = card ? card.offsetWidth : 195;
    const gap = 16;
    const step = cardWidth + gap;
    const maxScroll = container.scrollWidth - container.clientWidth;

    if (maxScroll > 15) {
      // Natural horizontal scrolling when overflow exists (e.g. mobile/tablet or 4+ items)
      if (direction === 'left') {
        if (container.scrollLeft <= 10) {
          container.scrollTo({ left: maxScroll, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: -step, behavior: 'smooth' });
        }
      } else {
        if (container.scrollLeft >= maxScroll - 10) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: step, behavior: 'smooth' });
        }
      }
    } else {
      // Visibly move / cycle cards when items fit within viewport on wide desktop
      if (direction === 'left') {
        setDynamicSubcats((prev) => {
          if (prev.length <= 1) return prev;
          return [prev[prev.length - 1], ...prev.slice(0, -1)];
        });
      } else {
        setDynamicSubcats((prev) => {
          if (prev.length <= 1) return prev;
          return [...prev.slice(1), prev[0]];
        });
      }
    }
  };

  return (
    <section className="categories-section">
      <div className="container">
        <div className="categories-slider-wrapper">
          {/* Left Arrow Button */}
          <button
            type="button"
            className="category-slider-arrow prev"
            onClick={() => handleScroll('left')}
            aria-label="Previous Category"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Cards Track */}
          <div className="categories-slider-track" ref={scrollRef}>
            {isLoadingSubcats ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <div key={`shimmer-${idx}`} className="category-tile-card shimmer-tile" />
              ))
            ) : (
              dynamicSubcats.map((subcat) => (
                <div
                  key={subcat.id}
                  className={`category-tile-card ${activeCategory === subcat.id ? 'active' : ''}`}
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
                  <img
                    src={subcat.image || 'https://via.placeholder.com/300x300?text=Jewellery'}
                    alt={subcat.name}
                    className="category-tile-img"
                    loading="lazy"
                  />
                  <div className="category-tile-vignette" />
                  <span className="category-tile-name">{subcat.name}</span>
                </div>
              ))
            )}
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            className="category-slider-arrow next"
            onClick={() => handleScroll('right')}
            aria-label="Next Category"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Categories;
