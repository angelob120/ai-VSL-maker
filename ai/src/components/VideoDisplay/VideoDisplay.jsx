import React from 'react';
import { Video } from 'lucide-react';
import './VideoDisplay.css';

const VideoDisplay = ({ settings, onChange, disabled }) => {
  const displayModes = [
    { value: 'small_bubble', label: 'Small Bubble' },
    { value: 'large_bubble', label: 'Large Bubble' }
  ];

  const positions = [
    { value: 'bottom_right', label: 'Bottom Right' },
    { value: 'bottom_left', label: 'Bottom Left' },
    { value: 'top_right', label: 'Top Right' },
    { value: 'top_left', label: 'Top Left' }
  ];

  const shapes = [
    { value: 'circle', label: 'Circle' },
    { value: 'square', label: 'Square' }
  ];

  const handleChange = (key, value) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="video-display-section">
      <div className="section-header">
        <Video size={20} />
        <h3>Video Display</h3>
      </div>

      <div className="settings-grid">
        <div className="setting-item">
          <label>Display Mode:</label>
          <select 
            value={settings.display_mode || 'small_bubble'}
            onChange={(e) => handleChange('display_mode', e.target.value)}
            disabled={disabled}
          >
            {displayModes.map(mode => (
              <option key={mode.value} value={mode.value}>{mode.label}</option>
            ))}
          </select>
        </div>

        <div className="setting-item">
          <label>Position:</label>
          <select 
            value={settings.position || 'bottom_right'}
            onChange={(e) => handleChange('position', e.target.value)}
            disabled={disabled}
          >
            {positions.map(pos => (
              <option key={pos.value} value={pos.value}>{pos.label}</option>
            ))}
          </select>
        </div>

        <div className="setting-item">
          <label>Shape:</label>
          <select 
            value={settings.shape || 'circle'}
            onChange={(e) => handleChange('shape', e.target.value)}
            disabled={disabled}
          >
            {shapes.map(shape => (
              <option key={shape.value} value={shape.value}>{shape.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default VideoDisplay;
