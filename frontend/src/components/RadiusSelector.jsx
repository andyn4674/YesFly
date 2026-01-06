import React from 'react';
import './RadiusSelector.css';

const RadiusSelector = ({ selectedRadius, onRadiusChange }) => {
  const radiusOptions = [
    { value: 30.48, label: '100 ft', description: 'Small area around you' },
    { value: 402.34, label: '0.25 mi', description: 'Neighborhood area' },
    { value: 804.67, label: '0.5 mi', description: 'Local area' },
    { value: 1609.34, label: '1 mi', description: 'City block area' },
    { value: 3218.69, label: '2 mi', description: 'Suburban area' },
    { value: 8046.72, label: '5 mi', description: 'Regional area' }
  ];

  return (
    <div className="radius-selector">
      <label className="radius-label">Search Radius</label>
      <div className="radius-options">
        {radiusOptions.map((option) => (
          <label key={option.value} className="radius-option">
            <input
              type="radio"
              name="radius"
              value={option.value}
              checked={selectedRadius === option.value}
              onChange={() => onRadiusChange(option.value)}
              className="radius-input"
            />
            <div className="radius-card">
              <div className="radius-value">{option.label}</div>
              <div className="radius-description">{option.description}</div>
            </div>
          </label>
        ))}
      </div>
      
      <div className="radius-info">
        <div className="current-radius">
          <span className="info-label">Current Selection:</span>
          <span className="info-value">
            {radiusOptions.find(opt => opt.value === selectedRadius)?.label || 'Select a radius'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RadiusSelector;
