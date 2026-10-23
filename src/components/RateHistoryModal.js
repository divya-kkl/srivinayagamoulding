import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { getRateHistoryFromSupabase } from '../services/rateService';
import './RateHistoryModal.css';

const RateHistoryModal = ({ isOpen, onClose, onOpenCalculator, liveRates = [] }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMetal, setSelectedMetal] = useState('22k');
  const [viewMode] = useState('graph');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Fetch 7-day rate history from Supabase when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getRateHistoryFromSupabase(7);
        if (isMounted) {
          if (res.error) {
            setError(res.error);
          } else {
            setHistory(res.groupedByDate || []);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load rate history');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchHistory();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isMounted = false;
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Format date helper: "21 Oct 2026", with Today / Yesterday badges
  const formatDateLabel = (dateStr, index) => {
    try {
      const d = new Date(dateStr);
      const formatted = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const shortDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const weekday = d.toLocaleDateString('en-IN', { weekday: 'short' });

      let tag = null;
      if (index === 0) tag = 'Today';
      else if (index === 1) tag = 'Yesterday';

      return { formatted, shortDate, weekday, tag };
    } catch {
      return { formatted: dateStr, shortDate: dateStr, weekday: '', tag: null };
    }
  };

  // Helper to extract specific rate item from a day's items
  const findRateItem = (items, typeKey) => {
    if (!items || !items.length) return null;
    const normalizedKey = (typeKey || '').toLowerCase();
    return items.find((item) => {
      const t = (item.type || item.name || '').toLowerCase();
      if (normalizedKey === '22k') return t.includes('22k') || t.includes('916');
      if (normalizedKey === '24k') return t.includes('24k') || t.includes('999');
      if (normalizedKey === '18k') return t.includes('18k');
      if (normalizedKey === 'silver') return t.includes('silver') || t.includes('வெள்ளி');
      return t === normalizedKey;
    });
  };

  // Dynamically discover all metals available in the history data
  const availableMetals = useMemo(() => {
    const map = new Map();
    history.forEach((day) => {
      day.items?.forEach((item) => {
        const type = item.type || item.name || '';
        if (!type) return;
        const lower = type.toLowerCase();
        let key = lower;
        let label = type;

        if (lower.includes('22k') || lower.includes('916')) {
          key = '22k';
          label = '22K Gold (916)';
        } else if (lower.includes('24k') || lower.includes('999')) {
          key = '24k';
          label = '24K Pure Gold';
        } else if (lower.includes('18k')) {
          key = '18k';
          label = '18K Gold';
        } else if (lower.includes('silver') || lower.includes('வெள்ளி')) {
          key = 'silver';
          label = 'Silver (வெள்ளி)';
        }

        if (!map.has(key)) {
          map.set(key, { key, label });
        }
      });
    });

    // Desired display priority
    const priority = ['22k', '24k', '18k', 'silver'];
    const sorted = Array.from(map.values()).sort((a, b) => {
      const ia = priority.indexOf(a.key);
      const ib = priority.indexOf(b.key);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.label.localeCompare(b.label);
    });

    return sorted;
  }, [history]);

  // If currently selected metal is not in available metals, auto-select first available
  useEffect(() => {
    if (availableMetals.length > 0) {
      const exists = availableMetals.some((m) => m.key === selectedMetal);
      if (!exists) {
        setSelectedMetal(availableMetals[0].key);
      }
    }
  }, [availableMetals, selectedMetal]);

  // Compute chronological data points for the Graph (Oldest to Newest)
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];

    // History is descending (Today -> 7 days ago).
    // For graph, reverse so X axis is chronological: Left (Past) -> Right (Today)
    const chronological = [...history].reverse();

    const points = [];
    chronological.forEach((day, idx) => {
      const item = findRateItem(day.items, selectedMetal);
      if (item && item.amount) {
        const prevPoint = points[points.length - 1] || null;
        const diff = prevPoint ? item.amount - prevPoint.amount : null;
        const { formatted, shortDate, weekday } = formatDateLabel(day.date, history.length - 1 - idx);

        points.push({
          date: day.date,
          formattedDate: formatted,
          shortDate,
          weekday,
          amount: parseFloat(item.amount),
          gram: parseFloat(item.gram) || 1,
          diff,
          rawItem: item,
          isToday: day.date === history[0]?.date,
        });
      }
    });

    return points;
  }, [history, selectedMetal]);

  // High, Low, and Latest metrics for selected metal
  const chartMetrics = useMemo(() => {
    if (chartData.length === 0) return null;
    const amounts = chartData.map((p) => p.amount);
    const high = Math.max(...amounts);
    const low = Math.min(...amounts);
    const latest = chartData[chartData.length - 1];
    const earliest = chartData[0];
    const overallChange = chartData.length > 1 ? latest.amount - earliest.amount : 0;
    const overallChangePercent = earliest.amount > 0 ? ((overallChange / earliest.amount) * 100).toFixed(2) : 0;

    return {
      high,
      low,
      latestAmount: latest.amount,
      overallChange,
      overallChangePercent,
      count: chartData.length,
    };
  }, [chartData]);

  // Compute daily changes for the card list view (comparing day i with day i+1)
  const daysWithChanges = useMemo(() => {
    return history.map((day, idx) => {
      const prevDay = history[idx + 1] || null;

      const rate22k = findRateItem(day.items, '22k');
      const prevRate22k = prevDay ? findRateItem(prevDay.items, '22k') : null;
      const diff22k = rate22k && prevRate22k ? rate22k.amount - prevRate22k.amount : null;

      const rate24k = findRateItem(day.items, '24k');
      const prevRate24k = prevDay ? findRateItem(prevDay.items, '24k') : null;
      const diff24k = rate24k && prevRate24k ? rate24k.amount - prevRate24k.amount : null;

      const rate18k = findRateItem(day.items, '18k');
      const prevRate18k = prevDay ? findRateItem(prevDay.items, '18k') : null;
      const diff18k = rate18k && prevRate18k ? rate18k.amount - prevRate18k.amount : null;

      const rateSilver = findRateItem(day.items, 'silver');
      const prevRateSilver = prevDay ? findRateItem(prevDay.items, 'silver') : null;
      const diffSilver = rateSilver && prevRateSilver ? rateSilver.amount - prevRateSilver.amount : null;

      return {
        ...day,
        rate22k,
        diff22k,
        rate24k,
        diff24k,
        rate18k,
        diff18k,
        rateSilver,
        diffSilver,
      };
    });
  }, [history]);

  if (!isOpen) return null;

  // Render Trend Indicator badge
  const renderTrend = (diff) => {
    if (diff === null || diff === undefined) {
      return <span className="rhm-trend-dash">—</span>;
    }
    if (diff > 0) {
      return (
        <span className="rhm-trend-badge up" title={`Increased by ₹${diff}`}>
          ▲ +₹{diff.toLocaleString('en-IN')}
        </span>
      );
    }
    if (diff < 0) {
      return (
        <span className="rhm-trend-badge down" title={`Decreased by ₹${Math.abs(diff)}`}>
          ▼ -₹{Math.abs(diff).toLocaleString('en-IN')}
        </span>
      );
    }
    return <span className="rhm-trend-badge neutral">0.00 (Unchanged)</span>;
  };

  // Render SVG Graph Elements
  const renderSvgChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="rhm-chart-empty">
          <p>No recorded rates found for {selectedMetal.toUpperCase()} in the last 7 days.</p>
          <small>Select another metal tab above to view its graph.</small>
        </div>
      );
    }

    const width = 680;
    const height = 240;
    const padding = { top: 25, right: 35, bottom: 45, left: 75 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const amounts = chartData.map((d) => d.amount);
    let min = Math.min(...amounts);
    let max = Math.max(...amounts);

    // Give vertical breathing room so points don't clip at top/bottom
    if (min === max) {
      min = Math.floor(min * 0.96);
      max = Math.ceil(max * 1.04);
    } else {
      const spread = max - min;
      min = Math.floor(Math.max(0, min - spread * 0.18));
      max = Math.ceil(max + spread * 0.18);
    }

    const n = chartData.length;
    const coords = chartData.map((d, i) => {
      const x = n === 1 ? padding.left + chartW / 2 : padding.left + (i / (n - 1)) * chartW;
      const y = padding.top + chartH - ((d.amount - min) / (max - min)) * chartH;
      return { ...d, x, y };
    });

    // Build SVG Path
    let linePath = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      // Smooth curve using cubic bezier control points
      const prev = coords[i - 1];
      const curr = coords[i];
      const cx1 = prev.x + (curr.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (curr.x - prev.x) / 2;
      const cy2 = curr.y;
      linePath += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
    }

    const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${padding.top + chartH} L ${coords[0].x} ${padding.top + chartH} Z`;

    // Horizontal grid ticks (4 levels)
    const ticks = [0, 0.33, 0.66, 1].map((pct) => {
      const val = Math.round(min + (max - min) * pct);
      const y = padding.top + chartH - pct * chartH;
      return { val, y };
    });

    const activePoint = hoveredPoint || coords[coords.length - 1];

    return (
      <div className="rhm-chart-container">
        {/* Floating Tooltip Display */}
        {activePoint && (
          <div className="rhm-chart-tooltip-banner">
            <div className="rhm-tooltip-date">
              <span className="rhm-tooltip-calendar-icon">📅</span>
              <strong>{activePoint.formattedDate}</strong>
              {activePoint.isToday && <span className="rhm-tag today">Today</span>}
            </div>
            <div className="rhm-tooltip-price">
              <span>Rate:</span>
              <strong className="rhm-tooltip-main-val">₹{activePoint.amount.toLocaleString('en-IN')}</strong>
              <small>/ 1 Gram</small>
            </div>
            {selectedMetal !== 'silver' && (
              <div className="rhm-tooltip-pavan">
                <span>1 Pavan (8g):</span>
                <strong>₹{(activePoint.amount * 8).toLocaleString('en-IN')}</strong>
              </div>
            )}
            {activePoint.diff !== null && (
              <div className="rhm-tooltip-diff">{renderTrend(activePoint.diff)}</div>
            )}
          </div>
        )}

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="rhm-svg-chart"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Area Fill Gradient */}
            <linearGradient id="rhmAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#D4AF37" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
            </linearGradient>

            {/* Line Stroke Gradient */}
            <linearGradient id="rhmLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#B8860B" />
              <stop offset="50%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#D4AF37" />
            </linearGradient>

            {/* Filter for Drop Glow */}
            <filter id="rhmGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#D4AF37" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Gridlines & Y-Axis Labels */}
          {ticks.map((t, idx) => (
            <g key={`tick-${idx}`} className="rhm-chart-grid-line">
              <line
                x1={padding.left}
                y1={t.y}
                x2={padding.left + chartW}
                y2={t.y}
                stroke="rgba(0, 0, 0, 0.08)"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={t.y + 4}
                textAnchor="end"
                className="rhm-chart-axis-label"
              >
                ₹{t.val.toLocaleString('en-IN')}
              </text>
            </g>
          ))}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#rhmAreaGradient)" />

          {/* Main Line */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#rhmLineGradient)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#rhmGlow)"
          />

          {/* Active Hover Guide Line */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={padding.top}
              x2={activePoint.x}
              y2={padding.top + chartH}
              stroke="#D4AF37"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              opacity="0.8"
            />
          )}

          {/* Data Points (Circles) & X-Axis Labels */}
          {coords.map((pt, i) => {
            const isHovered = hoveredPoint && hoveredPoint.date === pt.date;

            return (
              <g
                key={`pt-${pt.date || i}`}
                className="rhm-chart-point-group"
                onMouseEnter={() => setHoveredPoint(pt)}
                onClick={() => setHoveredPoint(pt)}
                style={{ cursor: 'pointer' }}
              >
                {/* Touch / Hover Hit Target */}
                <circle cx={pt.x} cy={pt.y} r="16" fill="transparent" />

                {/* Outer Glow Halo on Hover */}
                {isHovered && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="10"
                    fill="rgba(212, 175, 55, 0.3)"
                    className="rhm-point-halo"
                  />
                )}

                {/* Visible Data Point */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6.5 : 4.5}
                  fill="#450A14"
                  stroke="#FFD700"
                  strokeWidth={isHovered ? 3 : 2.2}
                  transition="all 0.2s ease"
                />

                {/* X-Axis Date Labels */}
                <text
                  x={pt.x}
                  y={padding.top + chartH + 20}
                  textAnchor="middle"
                  className={`rhm-chart-x-label ${isHovered ? 'active' : ''}`}
                >
                  {pt.shortDate}
                </text>
                <text
                  x={pt.x}
                  y={padding.top + chartH + 34}
                  textAnchor="middle"
                  className="rhm-chart-x-sublabel"
                >
                  {pt.weekday}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="rhm-chart-hint">
          <small>💡 Hover or tap any point to inspect exact rates & daily changes.</small>
        </div>
      </div>
    );
  };

  const modalContent = (
    <div className="modal-overlay rhm-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card rhm-modal animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header rhm-header">
          <div className="rhm-title-wrapper">
            <div className="rhm-header-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div>
              <div className="rhm-badge-row">
                <h3 className="rhm-title">Live Rate Graph & History</h3>
                <span className="rhm-days-tag">Last 7 Days</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn rhm-close-btn"
            onClick={onClose}
            aria-label="Close Rate History"
            title="Close"
          >
            ×
          </button>
        </div>

        {/* View Mode & Metal Bar */}
        <div className="rhm-filter-bar">
          {/* Metal Selector Tabs */}
          <div className="rhm-filter-group">
            {availableMetals.length > 0 ? (
              availableMetals.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className={`rhm-filter-btn ${selectedMetal === m.key ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedMetal(m.key);
                    setHoveredPoint(null);
                  }}
                >
                  {m.label}
                </button>
              ))
            ) : (
              <>
                <button
                  type="button"
                  className={`rhm-filter-btn ${selectedMetal === '22k' ? 'active' : ''}`}
                  onClick={() => setSelectedMetal('22k')}
                >
                  22K Gold (916)
                </button>
                <button
                  type="button"
                  className={`rhm-filter-btn ${selectedMetal === '24k' ? 'active' : ''}`}
                  onClick={() => setSelectedMetal('24k')}
                >
                  24K Pure Gold
                </button>
                <button
                  type="button"
                  className={`rhm-filter-btn ${selectedMetal === '18k' ? 'active' : ''}`}
                  onClick={() => setSelectedMetal('18k')}
                >
                  18K Gold
                </button>
                <button
                  type="button"
                  className={`rhm-filter-btn ${selectedMetal === 'silver' ? 'active' : ''}`}
                  onClick={() => setSelectedMetal('silver')}
                >
                  Silver (வெள்ளி)
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="rhm-body">
          {isLoading ? (
            <div className="rhm-loading-state">
              <div className="custom-gold-spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px' }}></div>
              <p>Fetching 7-day rate history & chart...</p>
            </div>
          ) : error ? (
            <div className="rhm-error-state">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="rhm-error-msg">{error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="rhm-empty-state">
              <p>No rate records found for the last 7 days.</p>
            </div>
          ) : (
            <>
              {/* GRAPH SECTION */}
              {(viewMode === 'graph' || viewMode === 'both') && (
                <div className="rhm-graph-section">
                  {/* Summary Metric Badges */}
                  {chartMetrics && (
                    <div className="rhm-metrics-bar">
                      <div className="rhm-metric-pill">
                        <span className="rhm-metric-lbl">Latest Rate:</span>
                        <strong className="rhm-metric-val gold">
                          ₹{chartMetrics.latestAmount.toLocaleString('en-IN')}
                        </strong>
                        <small>/ 1g</small>
                      </div>

                      <div className="rhm-metric-pill">
                        <span className="rhm-metric-lbl">7-Day High:</span>
                        <strong className="rhm-metric-val high">
                          ₹{chartMetrics.high.toLocaleString('en-IN')}
                        </strong>
                      </div>

                      <div className="rhm-metric-pill">
                        <span className="rhm-metric-lbl">7-Day Low:</span>
                        <strong className="rhm-metric-val low">
                          ₹{chartMetrics.low.toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* SVG Chart */}
                  {renderSvgChart()}
                </div>
              )}

              {/* DAY-BY-DAY LIST SECTION */}
              {(viewMode === 'list' || viewMode === 'both') && (
                <div className="rhm-history-list">
                  {viewMode === 'both' && (
                    <div className="rhm-section-divider">
                      <span>Daily Detailed Records</span>
                    </div>
                  )}

                  {daysWithChanges.map((day, idx) => {
                    const { formatted, weekday, tag } = formatDateLabel(day.date, idx);

                    return (
                      <div key={day.date || idx} className={`rhm-day-card ${idx === 0 ? 'is-today' : ''}`}>
                        {/* Day Header Bar */}
                        <div className="rhm-day-header">
                          <div className="rhm-day-title-wrap">
                            <span className="rhm-weekday">{weekday}</span>
                            <span className="rhm-date-text">{formatted}</span>
                            {tag && <span className={`rhm-tag ${tag.toLowerCase()}`}>{tag}</span>}
                          </div>

                          {day.diff22k !== null && (
                            <div className="rhm-day-quick-trend">
                              <small>22K Trend:</small> {renderTrend(day.diff22k)}
                            </div>
                          )}
                        </div>

                        {/* Rates Grid */}
                        <div className="rhm-rates-row">
                          {/* 22K Gold */}
                          <div className="rhm-rate-box gold-22k">
                            <div className="rhm-rate-box-header">
                              <span className="rhm-metal-name">22K Gold (916)</span>
                              {renderTrend(day.diff22k)}
                            </div>
                            {day.rate22k ? (
                              <>
                                <div className="rhm-amount-row">
                                  <span className="rhm-price-main">₹{day.rate22k.amount.toLocaleString('en-IN')}</span>
                                  <span className="rhm-unit">/ 1 Gram</span>
                                </div>
                                <div className="rhm-amount-sub">
                                  <span>1 Pavan (8g):</span>
                                  <strong>₹{(day.rate22k.amount * 8).toLocaleString('en-IN')}</strong>
                                </div>
                              </>
                            ) : (
                              <span className="rhm-not-updated">Not updated</span>
                            )}
                          </div>

                          {/* 24K Gold */}
                          <div className="rhm-rate-box gold-24k">
                            <div className="rhm-rate-box-header">
                              <span className="rhm-metal-name">24K Pure Gold</span>
                              {renderTrend(day.diff24k)}
                            </div>
                            {day.rate24k ? (
                              <>
                                <div className="rhm-amount-row">
                                  <span className="rhm-price-main">₹{day.rate24k.amount.toLocaleString('en-IN')}</span>
                                  <span className="rhm-unit">/ 1 Gram</span>
                                </div>
                                <div className="rhm-amount-sub">
                                  <span>1 Pavan (8g):</span>
                                  <strong>₹{(day.rate24k.amount * 8).toLocaleString('en-IN')}</strong>
                                </div>
                              </>
                            ) : (
                              <span className="rhm-not-updated">Not updated</span>
                            )}
                          </div>

                          {/* 18K Gold */}
                          <div className="rhm-rate-box gold-18k">
                            <div className="rhm-rate-box-header">
                              <span className="rhm-metal-name">18K Gold</span>
                              {renderTrend(day.diff18k)}
                            </div>
                            {day.rate18k ? (
                              <>
                                <div className="rhm-amount-row">
                                  <span className="rhm-price-main">₹{day.rate18k.amount.toLocaleString('en-IN')}</span>
                                  <span className="rhm-unit">/ 1 Gram</span>
                                </div>
                                <div className="rhm-amount-sub">
                                  <span>1 Pavan (8g):</span>
                                  <strong>₹{(day.rate18k.amount * 8).toLocaleString('en-IN')}</strong>
                                </div>
                              </>
                            ) : (
                              <span className="rhm-not-updated">Not updated</span>
                            )}
                          </div>

                          {/* Silver */}
                          <div className="rhm-rate-box silver">
                            <div className="rhm-rate-box-header">
                              <span className="rhm-metal-name">Silver (வெள்ளி)</span>
                              {renderTrend(day.diffSilver)}
                            </div>
                            {day.rateSilver ? (
                              <>
                                <div className="rhm-amount-row">
                                  <span className="rhm-price-main">₹{day.rateSilver.amount.toLocaleString('en-IN')}</span>
                                  <span className="rhm-unit">/ 1 Gram</span>
                                </div>
                                <div className="rhm-amount-sub">
                                  <span>1 Kg Silver:</span>
                                  <strong>₹{(day.rateSilver.amount * 1000).toLocaleString('en-IN')}</strong>
                                </div>
                              </>
                            ) : (
                              <span className="rhm-not-updated">Not updated</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="rhm-footer">
          <div className="rhm-footer-info">
            <span className="rhm-info-dot"></span>
            <span>
              Official market bullion rates updated daily. Prices exclude Making Charges & GST unless specified.
            </span>
          </div>
          <button type="button" className="rhm-footer-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? ReactDOM.createPortal(modalContent, document.body)
    : modalContent;
};

export default RateHistoryModal;
