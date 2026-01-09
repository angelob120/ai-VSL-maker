import React from 'react';
import { Settings } from 'lucide-react';
import './PageCustomization.css';

const PageCustomization = ({ settings, onChange, disabled }) => {
  const handleChange = (key, value) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="page-customization-section">
      <div className="section-header">
        <Settings size={20} />
        <h3>Page Customization</h3>
      </div>

      <div className="customization-form">
        <div className="form-group">
          <label>Video Title / Message</label>
          <input
            type="text"
            value={settings.video_title || ''}
            onChange={(e) => handleChange('video_title', e.target.value)}
            placeholder="A video for you 👋"
            disabled={disabled}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Button Text</label>
            <input
              type="text"
              value={settings.button_text || ''}
              onChange={(e) => handleChange('button_text', e.target.value)}
              placeholder="Book a Call"
              disabled={disabled}
            />
          </div>

          <div className="form-group">
            <label>Button Link</label>
            <input
              type="url"
              value={settings.button_link || ''}
              onChange={(e) => handleChange('button_link', e.target.value)}
              placeholder="https://calendly.com/..."
              disabled={disabled}
            />
          </div>
        </div>

        <div className="color-settings">
          <div className="color-group">
            <label>Accent</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                value={settings.accent_color || '#6366f1'}
                onChange={(e) => handleChange('accent_color', e.target.value)}
                disabled={disabled}
              />
              <div 
                className="color-preview" 
                style={{ backgroundColor: settings.accent_color || '#6366f1' }}
              />
            </div>
          </div>

          <div className="color-group">
            <label>Text</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                value={settings.text_color || '#ffffff'}
                onChange={(e) => handleChange('text_color', e.target.value)}
                disabled={disabled}
              />
              <div 
                className="color-preview" 
                style={{ backgroundColor: settings.text_color || '#ffffff' }}
              />
            </div>
          </div>

          <div className="color-group">
            <label>Background</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                value={settings.background_color || '#3b82f6'}
                onChange={(e) => handleChange('background_color', e.target.value)}
                disabled={disabled}
              />
              <div 
                className="color-preview" 
                style={{ backgroundColor: settings.background_color || '#3b82f6' }}
              />
            </div>
          </div>
        </div>

        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.dark_mode !== false}
              onChange={(e) => handleChange('dark_mode', e.target.checked)}
              disabled={disabled}
            />
            <span className="checkbox-custom"></span>
            <span>Dark mode (fallback)</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default PageCustomization;
