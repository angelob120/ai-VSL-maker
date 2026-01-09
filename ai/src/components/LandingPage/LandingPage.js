import React, { useState, useEffect, useRef } from 'react';
import { landingApi } from '../../utils/api';
import './LandingPage.css';

const LandingPage = ({ slug }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await landingApi.getBySlug(slug);
        // API returns { success, data: { ... } }
        if (response.data && response.data.success) {
          setData(response.data.data);
        } else {
          setError('Video not found');
        }
      } catch (err) {
        console.error('Failed to load landing page:', err);
        setError('Video not found');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  const handleVideoEnd = () => {
    setVideoEnded(true);
  };

  if (loading) {
    return (
      <div className="landing-page loading">
        <div className="loading-spinner"></div>
        <p>Loading your video...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="landing-page error">
        <div className="error-icon">📹</div>
        <h1>Video Not Found</h1>
        <p>This video link may have expired or been removed.</p>
      </div>
    );
  }

  const {
    videoUrl,
    firstName,
    lastNameOrCompany,
    settings = {}
  } = data;

  const {
    videoTitle = 'A video for you 👋',
    buttonText = 'Book a Call',
    buttonLink = '#',
    accentColor = '#6366f1',
    textColor = '#ffffff',
    backgroundColor = '#3b82f6',
    darkMode = true
  } = settings;

  // Personalize title
  const personalizedTitle = videoTitle
    .replace(/{first_name}/g, firstName || '')
    .replace(/{company}/g, lastNameOrCompany || '');

  const bgClass = darkMode ? 'dark' : 'light';

  return (
    <div 
      className={`landing-page ${bgClass}`}
      style={{
        '--accent-color': accentColor,
        '--text-color': textColor,
        '--bg-color': backgroundColor
      }}
    >
      <div className="landing-content">
        <h1 className="landing-title">{personalizedTitle}</h1>

        <div className="video-container">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            autoPlay
            playsInline
            onEnded={handleVideoEnd}
            className="landing-video"
          />
        </div>

        <div className={`cta-section ${videoEnded ? 'show' : ''}`}>
          <a 
            href={buttonLink}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-button"
            style={{ backgroundColor: accentColor }}
          >
            {buttonText}
          </a>
        </div>

        <div className="landing-footer">
          <p>Made with AI VSL Creator</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
