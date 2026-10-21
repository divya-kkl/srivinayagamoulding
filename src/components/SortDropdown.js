import React, { useState, useRef, useEffect } from 'react';
import './SortDropdown.css';

const SortDropdown = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const defaultOptions = [
    { value: 'position', label: 'Position' },
    { value: 'price-low-high', label: 'Price: Low to High' },
    { value: 'price-high-low', label: 'Price: High to Low' },
  ];

  const items = options || defaultOptions;
  const currentOption = items.find(opt => opt.value === value) || items[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  return (
    <div className="custom-sort-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className={`sort-dropdown-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="sort-selected-label">{currentOption?.label}</span>
        <svg
          className={`sort-caret ${isOpen ? 'rotated' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <ul className="sort-dropdown-menu" role="listbox">
          {items.map((opt) => (
            <li
              key={opt.value}
              className={`sort-dropdown-item ${opt.value === value ? 'selected' : ''}`}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              <span>{opt.label}</span>
              {opt.value === value && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SortDropdown;
