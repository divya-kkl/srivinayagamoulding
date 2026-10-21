import React, { useState, useEffect, useRef } from 'react';
import './LoadMoreSection.css';

const LoadMoreSection = ({ currentCount, totalCount, onLoadMore, step = 12 }) => {
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef(null);

  const hasMore = currentCount < totalCount;
  const progressPercent = totalCount > 0 ? Math.min(100, Math.round((currentCount / totalCount) * 100)) : 0;

  const handleLoad = () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    setTimeout(() => {
      if (typeof onLoadMore === 'function') {
        onLoadMore();
      }
      setIsLoading(false);
    }, 600);
  };

  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          handleLoad();
        }
      },
      {
        root: null,
        rootMargin: '120px',
        threshold: 0.1,
      }
    );

    const target = containerRef.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) observer.unobserve(target);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isLoading, currentCount, totalCount]);

  if (!hasMore && totalCount <= step) {
    return null;
  }

  return (
    <div className="auto-load-more-container" ref={containerRef}>
      <div className="auto-load-more-text">
        You've viewed {currentCount} of {totalCount} results
      </div>

      <div className="auto-load-more-track">
        <div
          className="auto-load-more-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {hasMore && (
        <button
          type="button"
          className="auto-load-more-btn"
          onClick={handleLoad}
          disabled={isLoading}
          aria-label="Load more results"
        >
          <div className="auto-load-spinner" />
        </button>
      )}
    </div>
  );
};

export default LoadMoreSection;
