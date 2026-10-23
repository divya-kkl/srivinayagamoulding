import React, { useState } from 'react';
import './CartDrawer.css';

const CartDrawer = ({ isOpen, onClose, cart, onUpdateQuantity, onRemoveItem }) => {
  const [isCheckoutStep, setIsCheckoutStep] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const gstAmount = Math.round(subtotal * 0.03); // 3% GST
  const grandTotal = subtotal + gstAmount;

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    setOrderSuccess(true);
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-container animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title-group">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <h3>{isCheckoutStep ? 'Checkout Order' : 'Your Shopping Cart'} ({cart.reduce((a, b) => a + b.quantity, 0)})</h3>
          </div>
          <button className="drawer-close-btn" onClick={onClose}>×</button>
        </div>

        {orderSuccess ? (
          <div className="order-success-screen">
            <div className="success-icon-badge">✓</div>
            <h2>Order Confirmed!</h2>
            <p className="order-id">Order ID: #GOD-{Math.floor(100000 + Math.random() * 900000)}</p>
            <p className="success-msg">
              Thank you for choosing Sri vinayaga Moulding. Your 100% BIS Hallmarked jewellery is packed with transit insurance and will be delivered shortly.
            </p>
            <button className="btn-gold" onClick={() => { setOrderSuccess(false); setIsCheckoutStep(false); onClose(); }}>
              CONTINUE SHOPPING
            </button>
          </div>
        ) : isCheckoutStep ? (
          <form className="checkout-form-container" onSubmit={handlePlaceOrder}>
            <div className="form-section-title">Shipping & Contact Details</div>

            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" placeholder="e.g. Ananya Sundaram" required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone Number *</label>
                <input type="tel" placeholder="+91 98765 43210" required />
              </div>
              <div className="form-group">
                <label>Pincode *</label>
                <input type="text" placeholder="600001" required />
              </div>
            </div>

            <div className="form-group">
              <label>Delivery Address *</label>
              <textarea placeholder="Door No, Street, Landmark, City..." rows="3" required></textarea>
            </div>

            <div className="form-section-title" style={{ marginTop: '1.5rem' }}>Select Payment Method</div>
            <div className="payment-options-grid">
              <label className="payment-radio-card">
                <input type="radio" name="payment" defaultChecked />
                <span>💳 Credit / Debit Card</span>
              </label>
              <label className="payment-radio-card">
                <input type="radio" name="payment" />
                <span>📱 UPI / GooglePay / PhonePe</span>
              </label>
              <label className="payment-radio-card">
                <input type="radio" name="payment" />
                <span>🏦 Net Banking</span>
              </label>
              <label className="payment-radio-card">
                <input type="radio" name="payment" />
                <span>📦 Cash on Delivery (Insured)</span>
              </label>
            </div>

            <div className="checkout-summary-mini">
              <div>Total Payable Amount: <strong>₹{grandTotal.toLocaleString('en-IN')}</strong></div>
            </div>

            <div className="checkout-form-buttons">
              <button type="button" className="btn-outline-gold" onClick={() => setIsCheckoutStep(false)}>
                ← Back to Cart
              </button>
              <button type="submit" className="btn-gold">
                CONFIRM & PAY ₹{grandTotal.toLocaleString('en-IN')}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="drawer-body">
              {cart.length === 0 ? (
                <div className="empty-cart-view">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="1">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <h4>Your Cart is Empty</h4>
                  <p>Explore our exquisite gold and diamond jewellery collections.</p>
                  <button className="btn-gold" onClick={onClose}>BROWSE JEWELLERY</button>
                </div>
              ) : (
                <div className="cart-items-list">
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item-card">
                      <img src={item.image} alt={item.name} className="cart-item-img" />
                      <div className="cart-item-info">
                        <span className="cart-item-purity">{item.purity}</span>
                        <h4 className="cart-item-name">{item.name}</h4>
                        <div className="cart-item-weight">Weight: {item.weight} gms</div>
                        <div className="cart-item-price">₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>

                        <div className="cart-item-qty-row">
                          <div className="qty-picker">
                            <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>-</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>+</button>
                          </div>
                          <button className="remove-item-btn" onClick={() => onRemoveItem(item.id)}>Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="drawer-footer">
                <div className="cart-summary-line">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="cart-summary-line">
                  <span>GST (3%):</span>
                  <span>₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="cart-summary-line">
                  <span>Insured Doorstep Delivery:</span>
                  <span className="free-shipping-tag">FREE</span>
                </div>
                <div className="cart-summary-divider"></div>
                <div className="cart-grand-total">
                  <span>Grand Total:</span>
                  <span className="total-price-gold">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>

                <button className="btn-gold full-width" onClick={() => setIsCheckoutStep(true)}>
                  PROCEED TO CHECKOUT
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
