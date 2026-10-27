import React from 'react';
import './Footer.css';

const Footer = ({ onSelectCategory, onOpenCalculator, logoUrl, shopName = 'Sri vinayaga Moulding', siteSettings = {}, isLoadingSettings }) => {
  return (
    <footer className="main-footer-section">
      <div className="container">
        <div className="footer-top-grid">

          <div className="footer-brand-col">
            <div className="brand-logo-wrapper" style={{ marginBottom: '1rem', cursor: 'pointer' }} onClick={() => { if (typeof onSelectCategory === 'function') onSelectCategory('all'); if (window.location.pathname !== '/') window.location.href = '/'; }}>
              {logoUrl ? (
                <img src={logoUrl} alt={shopName} style={{ maxHeight: '45px', objectFit: 'contain', marginRight: '10px' }} />
              ) : (
                <div className="brand-emblem">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#goldGradient2)" strokeWidth="1.5">
                    <defs>
                      <linearGradient id="goldGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
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
                    <div className="nav-shimmer" style={{ width: '180px', height: '12px', borderRadius: '4px' }}></div>
                  </>
                ) : (
                  <>
                    <span className="brand-title brand-font">{shopName?.toUpperCase() || ''}</span>
                    {/* <span className="brand-subtitle">EXQUISITE GOLD & DIAMONDS</span> */}
                  </>
                )}
              </div>
            </div>

            <div className="footer-about-text">
              {isLoadingSettings ? (
                <>
                  <div className="nav-shimmer" style={{ width: '100%', height: '14px', marginBottom: '8px', borderRadius: '4px' }}></div>
                  <div className="nav-shimmer" style={{ width: '90%', height: '14px', marginBottom: '8px', borderRadius: '4px' }}></div>
                  <div className="nav-shimmer" style={{ width: '60%', height: '14px', borderRadius: '4px' }}></div>
                </>
              ) : (
                <p style={{ margin: 0 }}>Experience royal craftsmanship, exclusive gold, diamond and platinum collections, and check live gold rates updated daily. 100% BIS Hallmarked purity guaranteed.</p>
              )}
            </div>

            {/* <div className="footer-social-icons">
              <span className="social-icon">Instagram</span>
              <span className="social-icon">Facebook</span>
              <span className="social-icon">YouTube</span>
              <span className="social-icon">WhatsApp</span>
            </div> */}
          </div>

          {/* Quick Links Col */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-links-list">
              <li onClick={() => { if (typeof onSelectCategory === 'function') onSelectCategory('all'); if (window.location.pathname !== '/') window.location.href = '/'; }}>Home</li>
              <li onClick={() => { window.location.href = '/contact'; }}>Contact Us</li>
            </ul>
          </div>

          {/* Contact Details Col */}
          <div className="footer-contact-col">
            <h4 className="footer-col-title">Store & Contact Info</h4>
            <ul className="footer-contact-list">
              <li>
                <span className="c-icon">📍</span>
                <span>{isLoadingSettings ? <div className="nav-shimmer" style={{ display: 'inline-block', width: '200px', height: '14px', borderRadius: '4px' }}></div> : (siteSettings?.store_address || 'Sri vinayaga Moulding Flagship Store, No. 42, Cathedral Road, T. Nagar, Chennai - 600017')}</span>
              </li>
              <li className="footer-contact-phone-item">
                {isLoadingSettings ? (
                  <>
                    <span className="c-icon">📞</span>
                    <div className="nav-shimmer" style={{ display: 'inline-block', width: '120px', height: '14px', borderRadius: '4px' }}></div>
                  </>
                ) : (
                  (() => {
                    const phoneString = siteSettings?.store_phone || '+91 98431 72314';
                    const parts = phoneString.split('/');
                    const firstCleanNumber = parts[0]?.trim().replace(/[^0-9+]/g, '') || '';
                    return (
                      <>
                        <a
                          href={`tel:${firstCleanNumber}`}
                          className="footer-phone-icon-link"
                          title="Call Us"
                          aria-label="Call store"
                        >
                          <span className="c-icon">📞</span>
                        </a>
                        <span className="footer-phone-numbers">
                          {parts.map((part, index) => {
                            const trimmed = part.trim();
                            const dialNumber = trimmed.replace(/[^0-9+]/g, '');
                            return (
                              <React.Fragment key={index}>
                                <a
                                  href={`tel:${dialNumber}`}
                                  className="footer-phone-link"
                                  title={`Call ${trimmed}`}
                                >
                                  {trimmed}
                                </a>
                                {index < parts.length - 1 && <span className="footer-phone-separator"> / </span>}
                              </React.Fragment>
                            );
                          })}
                        </span>
                      </>
                    );
                  })()
                )}
              </li>
              <li>
                <span className="c-icon">✉️</span>
                <span>
                  {isLoadingSettings ? (
                    <div className="nav-shimmer" style={{ display: 'inline-block', width: '150px', height: '14px', borderRadius: '4px' }}></div>
                  ) : (
                    <a
                      href={`mailto:${siteSettings?.store_email || 'support@godjewellery.com'}`}
                      className="footer-phone-link"
                      title="Send Email"
                    >
                      {siteSettings?.store_email || 'support@godjewellery.com'}
                    </a>
                  )}
                </span>
              </li>
              <li>
                <span className="c-icon">🕒</span>
                <span>{isLoadingSettings ? <div className="nav-shimmer" style={{ display: 'inline-block', width: '140px', height: '14px', borderRadius: '4px' }}></div> : (siteSettings?.store_timing || 'Mon - Sun: 10:00 AM - 9:00 PM')}</span>
              </li>
            </ul>

            {/* WhatsApp and Instagram Social Links */}
            <div className="footer-contact-socials">
              <a
                href={`https://wa.me/${(() => {
                  const raw = siteSettings?.store_phone || '9843172314';
                  const digits = raw.replace(/\D/g, '');
                  return digits.length >= 10 ? (digits.length === 10 ? `91${digits}` : digits) : '919843172314';
                })()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-social-icon whatsapp-icon"
                title="Chat on WhatsApp"
                aria-label="WhatsApp"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.073.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.203c.043.071.043.419-.101.824z" />
                </svg>
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-social-icon instagram-icon"
                title="Follow on Instagram"
                aria-label="Instagram"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>

          

          <div className="footer-map-col">
            <h4 className="footer-col-title">Store Location</h4>
            <div className="map-snippet-box">
              {isLoadingSettings ? (
                <div className="nav-shimmer" style={{ width: '100%', height: '160px', borderRadius: '8px' }}></div>
              ) : siteSettings?.latitude && siteSettings?.longitude ? (
                <iframe
                  title="Store Location"
                  width="100%"
                  height="160"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight="0"
                  marginWidth="0"
                  src={`https://maps.google.com/maps?q=${siteSettings.latitude},${siteSettings.longitude}&hl=en&z=14&output=embed`}
                  style={{ borderRadius: '8px', border: '1px solid var(--border-gold)' }}
                ></iframe>
              ) : (
                <div className="map-fake-bg">
                  <span className="map-pin-icon">📍</span>
                  <span className="map-location-name">{shopName}</span>
                  <small>Open in Google Maps</small>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="copyright-text">
            {isLoadingSettings ? (
              <div className="nav-shimmer" style={{ display: 'inline-block', width: '220px', height: '14px', borderRadius: '4px' }}></div>
            ) : (
              `© ${new Date().getFullYear()} ${shopName}. All Rights Reserved.`
            )}
          </div>

          <div className="developer-attribution">
            <a
              href="https://www.kitzo.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="kitzo-link"
              title="Kitzo Technologies"
            >
              Designed &amp; Developed by Kitzo Technologies
            </a>
          </div>
          {/* 
          <div className="payment-badges-row">
            <span className="p-badge">BIS 916 Hallmark</span>
            <span className="p-badge">IGI Diamond Certified</span>
            <span className="p-badge">Razorpay Secure</span>
            <span className="p-badge">Insured Delivery</span>
          </div> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
