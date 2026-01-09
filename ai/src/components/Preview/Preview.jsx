import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Globe, ExternalLink } from 'lucide-react';
import './Preview.css';

const Preview = ({ 
  leads = [], 
  videos = [],
  settings,
  introVideoUrl
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const iframeRef = useRef(null);

  const currentLead = leads[currentIndex];
  const currentVideo = videos.find(v => v.lead_id === currentLead?.id);

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(leads.length - 1, prev + 1));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [leads.length]);

  const displayName = currentLead?.first_name 
    ? `${currentLead.first_name}${currentLead.last_name_or_company ? ` ${currentLead.last_name_or_company}` : ''}`
    : currentLead?.last_name_or_company || 'Lead Preview';

  const landingPageUrl = currentVideo?.landing_page_url || '#';

  if (!leads.length) {
    return (
      <div className="preview-section">
        <div className="preview-header">
          <h3>Preview</h3>
        </div>
        <div className="preview-empty">
          <Globe size={48} className="empty-icon" />
          <p>Upload a video to see preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-section">
      <div className="preview-header">
        <h3>Preview</h3>
        <div className="preview-navigation">
          <button 
            className="nav-btn" 
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft size={20} />
          </button>
          <span className="nav-counter">
            {currentIndex + 1} / {leads.length}
          </span>
          <button 
            className="nav-btn" 
            onClick={handleNext}
            disabled={currentIndex === leads.length - 1}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="preview-lead-info">
        <span className="lead-name">{displayName}</span>
        <a 
          href={landingPageUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="landing-url"
        >
          {landingPageUrl}
          <ExternalLink size={12} />
        </a>
      </div>

      <div className="preview-container">
        {/* Website Background */}
        <div className="website-background">
          <iframe
            ref={iframeRef}
            src={currentLead?.website_url}
            title="Website Preview"
            className="website-iframe"
            sandbox="allow-scripts allow-same-origin"
          />
          <div className="website-overlay">
            <Globe size={32} />
            <span className="website-url">{currentLead?.website_url}</span>
            <span className="scroll-hint">(Scrolling website background)</span>
          </div>
        </div>

        {/* Video Bubble */}
        {introVideoUrl && (
          <div 
            className={`video-bubble ${settings?.position || 'bottom_right'} ${settings?.shape || 'circle'}`}
            style={{
              '--bubble-size': settings?.display_mode === 'large_bubble' ? '180px' : '120px'
            }}
          >
            <video 
              src={introVideoUrl}
              autoPlay
              muted
              loop
              playsInline
            />
          </div>
        )}
      </div>

      <div className="preview-hint">
        <span>💡 Use ← → arrow keys to navigate leads</span>
      </div>
    </div>
  );
};

export default Preview;
