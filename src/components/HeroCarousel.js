import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './HeroCarousel.css';
import { fetchBanners } from '../redux/slices/bannersSlice';

const DEFAULT_SLIDES = [

];

const HeroCarousel = () => {
  const dispatch = useDispatch();
  const { items, isLoading } = useSelector((state) => state.banners);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Always fetch latest active banners on mount from Supabase
  useEffect(() => {
    dispatch(fetchBanners(true)).finally(() => {
      setHasLoaded(true);
    });
  }, [dispatch]);

  const activeDbBanners = (items || []).filter(
    (b) => !b.status || b.status.toUpperCase() === 'ACTIVE'
  );

  // Use uploaded banners from DB if available, otherwise use default bridal slides
  const slides = activeDbBanners.length > 0
    ? activeDbBanners.map((b, idx) => ({
        id: b.id || `db-${idx}`,
        image: b.image
      }))
    : DEFAULT_SLIDES;

  const [currentSlide, setCurrentSlide] = useState(0);

  // Reset or adjust currentSlide if slides change
  useEffect(() => {
    if (currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  // Automatic slide cycle every 4 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handlePrevSlide = (e) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNextSlide = (e) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  if (isLoading || !hasLoaded) {
    return (
      <section className="hero-carousel-section">
        <div className="hero-banner-container hero-banner-shimmer-container">
          <div className="hero-banner-shimmer" />
        </div>
      </section>
    );
  }

  return (
    <section className="hero-carousel-section">
      <div className="hero-banner-container">
        {/* Banner Images Layer */}
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`hero-slide-item ${currentSlide === idx ? 'active' : ''}`}
            style={{
              opacity: currentSlide === idx ? 1 : 0,
              zIndex: currentSlide === idx ? 2 : 1
            }}
          >
            <img
              src={slide.image}
              alt={`Banner ${idx + 1}`}
              className="hero-banner-image"
              loading={idx === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}

        {/* Carousel Navigation Arrows */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              className="hero-nav-arrow prev"
              onClick={handlePrevSlide}
              aria-label="Previous Banner"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className="hero-nav-arrow next"
              onClick={handleNextSlide}
              aria-label="Next Banner"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

        {/* Bottom Center Slide Dots Indicator */}
        {slides.length > 1 && (
          <div className="hero-slide-dots">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`hero-dot-btn ${currentSlide === idx ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroCarousel;
