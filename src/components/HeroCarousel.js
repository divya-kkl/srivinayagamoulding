import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './HeroCarousel.css';
import { fetchBanners } from '../redux/slices/bannersSlice';

const HeroCarousel = () => {
  const dispatch = useDispatch();
  const { items, isLoading } = useSelector((state) => state.banners);
  const activeBanners = (items || []).filter((b) => b.status === 'ACTIVE');
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!items || items.length === 0) {
      dispatch(fetchBanners(true));
    }
  }, [dispatch, items]);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
    }, 4000); 
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  if (isLoading || activeBanners.length === 0) {
    return null;
  }

  return (
    <section className="hero-carousel-section">
      <div className="hero-banner-container">
        {activeBanners.map((banner, idx) => (
          <img
            key={banner.id}
            src={banner.image}
            alt={`Banner ${idx + 1}`}
            className="hero-banner-image"
            style={{
              opacity: currentSlide === idx ? 1 : 0,
              zIndex: currentSlide === idx ? 2 : 1
            }}
          />
        ))}

        {activeBanners.length > 1 && (
          <div className="carousel-controls">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                className={`carousel-dot ${currentSlide === idx ? 'active' : ''}`}
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
