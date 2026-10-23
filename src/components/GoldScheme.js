import React, { useState } from 'react';
import './GoldScheme.css';

const GoldScheme = ({ onSelectCategory }) => {
  const [monthlyAmount, setMonthlyAmount] = useState(5000);

  const customerTotalPaid = monthlyAmount * 11;
  const companyBonus = monthlyAmount;
  const totalSchemeValue = customerTotalPaid + companyBonus;

  return (
    <section className="gold-scheme-section" id="gold-savings-scheme">
      <div className="container">
        <div className="scheme-box-container">
          <div className="scheme-info-col">
            <span className="scheme-top-badge brand-font">GOLDEN HARVEST SCHEME</span>
            <h2 className="scheme-title">Save Monthly, Wear Royal Gold!</h2>
            <p className="scheme-desc">
              Plan your future weddings, anniversaries, or gold investments smartly. Pay 11 monthly installments and get the 12th month installment completely FREE from Sri vinayaga Moulding!
            </p>

            <ul className="scheme-benefits-list">
              <li>
                <span className="check-icon">✓</span>
                <div>
                  <strong>100% 12th Month Bonus:</strong> Sri vinayaga Moulding pays your final month installment.
                </div>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <div>
                  <strong>0% Making Charge Waiver:</strong> Enjoy up to 100% discount on making charges on selected gold items.
                </div>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <div>
                  <strong>Rate Protection:</strong> Option to lock in lowest gold rate during your scheme tenure.
                </div>
              </li>
            </ul>
          </div>

          <div className="scheme-calc-card">
            <h3 className="calc-card-header">Interactive Scheme Calculator</h3>

            <div className="calc-amount-selector">
              <label>Monthly Savings Amount:</label>
              <div className="amount-val-display">₹{monthlyAmount.toLocaleString('en-IN')} / month</div>
              <input
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(parseInt(e.target.value))}
                className="calc-range-slider"
              />
              <div className="preset-chip-group">
                {[2000, 5000, 10000, 25000].map((amt) => (
                  <button
                    key={amt}
                    className={`preset-chip ${monthlyAmount === amt ? 'active' : ''}`}
                    onClick={() => setMonthlyAmount(amt)}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            <div className="scheme-result-box">
              <div className="result-row">
                <span>You Pay (11 Months):</span>
                <span>₹{customerTotalPaid.toLocaleString('en-IN')}</span>
              </div>
              <div className="result-row bonus-row">
                <span>Sri vinayaga Moulding Bonus (12th Month):</span>
                <span className="bonus-val">+ ₹{companyBonus.toLocaleString('en-IN')} (FREE)</span>
              </div>
              <div className="result-divider"></div>
              <div className="result-total-row">
                <span>Total Gold Purchase Value:</span>
                <span className="total-gold-val">₹{totalSchemeValue.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              className="btn-gold full-width"
              onClick={() => alert(`Thank you for choosing Golden Harvest Scheme of ₹${monthlyAmount.toLocaleString('en-IN')}/month! Our scheme executive will contact you shortly.`)}
            >
              ENROLL IN SCHEME NOW
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GoldScheme;
