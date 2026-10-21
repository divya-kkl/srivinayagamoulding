import React, { useState, useEffect } from 'react';
import './Testimonials.css';
import { INSTAGRAM_POSTS } from '../data/jewelleryData';
import { getTestimonialsFromSupabase } from '../services/testimonialService';

const Testimonials = ({ shopName = 'God Jewellery', isLoadingSettings }) => {
  const [dynamicTestimonials, setDynamicTestimonials] = useState([]);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      setIsLoadingTestimonials(true);
      const { data } = await getTestimonialsFromSupabase(true);
      if (data && data.length > 0) {
        setDynamicTestimonials(data);
      }
      setIsLoadingTestimonials(false);
    };
    fetchTestimonials();
  }, []);

  if (!isLoadingTestimonials && dynamicTestimonials.length === 0) return null;

  return (
    <section className="testimonials-section">
      <div className="container">
     
        <div className="section-header text-center">
          <span className="section-subtitle brand-font">REAL STORIES OF TRUST</span>
          <h2 className="section-title">Loved by Thousands of Customers</h2>
          <div className="gold-divider"></div>
        </div>

        <div className="testimonials-grid">
          {isLoadingTestimonials ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={`shimmer-t-${idx}`} className="testimonial-card">
                <div className="testi-shimmer" style={{ width: '80px', height: '16px', marginBottom: '15px', borderRadius: '4px' }}></div>
                <div className="testi-shimmer" style={{ width: '100%', height: '14px', marginBottom: '8px', borderRadius: '4px' }}></div>
                <div className="testi-shimmer" style={{ width: '80%', height: '14px', marginBottom: '20px', borderRadius: '4px' }}></div>
                
                <div className="customer-profile-row" style={{ marginTop: 'auto' }}>
                  <div className="testi-shimmer" style={{ width: '45px', height: '45px', borderRadius: '50%' }}></div>
                  <div className="customer-meta" style={{ flex: 1 }}>
                    <div className="testi-shimmer" style={{ width: '100px', height: '14px', marginBottom: '6px', borderRadius: '4px' }}></div>
                    <div className="testi-shimmer" style={{ width: '140px', height: '12px', borderRadius: '4px' }}></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            dynamicTestimonials.slice(0, 4).map((t) => (
              <div key={t.id} className="testimonial-card">
                <div className="stars-row">
                  {"★".repeat(t.rating)}
                </div>
                <p className="testimonial-quote">"{t.review}"</p>

                <div className="customer-profile-row">
                  {t.image ? (
                    <img src={t.image} alt={t.name} className="customer-avatar" />
                  ) : (
                    <div className="customer-avatar" style={{background: '#e8c974', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.2rem'}}>
                      {t.name.charAt(0)}
                    </div>
                  )}
                  <div className="customer-meta">
                    <h4 className="customer-name">{t.name}</h4>
                    <span className="customer-location">
                      {t.location && `📍 ${t.location} `}
                      {t.verifiedBuyer && <span className="verified-badge">✓ Verified Buyer</span>}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="social-showcase-wrapper">
          <div className="section-header text-center" style={{ marginTop: '4rem', marginBottom: '2rem' }}>
            {isLoadingSettings ? (
              <div className="testi-shimmer" style={{ width: '250px', height: '14px', margin: '0 auto 10px', borderRadius: '4px' }}></div>
            ) : (
              <span className="section-subtitle brand-font">#{shopName?.toUpperCase().replace(/\s+/g, '')} LOOKS</span>
            )}
            <h2 className="section-title">Shop Our Instagram Gallery</h2>
          </div>

          <div className="insta-gallery-grid">
            {isLoadingTestimonials ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <div key={`shimmer-insta-${idx}`} className="insta-post-card testi-shimmer" style={{ borderRadius: '8px' }}></div>
              ))
            ) : (
              INSTAGRAM_POSTS.map((post) => (
                <div key={post.id} className="insta-post-card">
                  <img src={post.image} alt="Customer wearing jewellery" />
                  <div className="insta-overlay">
                    <span className="likes-count">❤️ {post.likes}</span>
                    <span className="insta-tag">{post.tag}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
