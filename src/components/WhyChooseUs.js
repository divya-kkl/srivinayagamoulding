import React from 'react';
import './WhyChooseUs.css';

const FEATURES = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
    title: "100% BIS Hallmarked",
    description: "Every gold item comes with official government BIS 916 Hallmark laser engraving for guaranteed purity."
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    title: "Certified Diamonds",
    description: "All solitaire and diamond jewellery comes with internationally recognized IGI & GIA certificates."
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    title: "Transparent Live Pricing",
    description: "We charge exact live gold rates with clear breakdown of weight, purity, making charges, and GST."
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2">
        <polyline points="23 4 23 10 17 10"/>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
      </svg>
    ),
    title: "Lifetime Exchange",
    description: "Enjoy 100% gold value exchange anytime with 0% weight deduction policy across all showroom branches."
  }
];

const WhyChooseUs = ({ shopName = 'God Jewellery', isLoadingSettings }) => {
  return (
    <section className="why-us-section">
      <div className="container">
        <div className="why-us-banner">
          <div className="why-us-header text-center">
            {isLoadingSettings ? (
              <>
                <div className="nav-shimmer" style={{ width: '250px', height: '14px', margin: '0 auto 10px', borderRadius: '4px' }}></div>
                <div className="nav-shimmer" style={{ width: '400px', height: '36px', margin: '0 auto 15px', borderRadius: '6px' }}></div>
              </>
            ) : (
              <>
                <span className="section-subtitle brand-font">THE {shopName?.toUpperCase()} PROMISE</span>
                <h2 className="section-title text-gold">Why Choose {shopName}?</h2>
              </>
            )}
            {isLoadingSettings ? (
              <div style={{ marginTop: '20px' }}>
                <div className="nav-shimmer" style={{ width: '80%', height: '14px', margin: '0 auto 8px', borderRadius: '4px' }}></div>
                <div className="nav-shimmer" style={{ width: '60%', height: '14px', margin: '0 auto', borderRadius: '4px' }}></div>
              </div>
            ) : (
              <p className="why-us-intro">
                Over 40 years of royal heritage, delivering trusted purity, uncompromised craftsmanship, and gold standard customer satisfaction.
              </p>
            )}
          </div>

          <div className="features-grid">
            {isLoadingSettings ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={`shimmer-feat-${idx}`} className="feature-card" style={{ height: '240px' }}>
                  <div className="feature-icon-wrapper nav-shimmer" style={{ width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 20px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
                  <div className="nav-shimmer" style={{ width: '70%', height: '18px', margin: '0 auto 15px', borderRadius: '4px' }}></div>
                  <div className="nav-shimmer" style={{ width: '90%', height: '12px', margin: '0 auto 8px', borderRadius: '4px' }}></div>
                  <div className="nav-shimmer" style={{ width: '90%', height: '12px', margin: '0 auto 8px', borderRadius: '4px' }}></div>
                  <div className="nav-shimmer" style={{ width: '70%', height: '12px', margin: '0 auto', borderRadius: '4px' }}></div>
                </div>
              ))
            ) : (
              FEATURES.map((feat, idx) => (
                <div key={idx} className="feature-card">
                  <div className="feature-icon-wrapper">
                    {feat.icon}
                  </div>
                  <h3 className="feature-title">{feat.title}</h3>
                  <p className="feature-desc">{feat.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
