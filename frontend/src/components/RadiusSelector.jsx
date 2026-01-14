import React from 'react';
import '../styles/components/RadiusSelector.css';

const RadiusSelector = ({ selectedRadius, onRadiusChange }) => {
  const radiusOptions = [
    { value: 0.01893939, label: '100 ft', description: 'Small area around you' },
    { value: 0.25, label: '0.25 mi', description: 'Neighborhood area' },
    { value: 0.5, label: '0.5 mi', description: 'Local area' },
    { value: 1, label: '1 mi', description: 'City block area' },
    { value: 2, label: '2 mi', description: 'Large area' },
    { value: 5, label: '5 mi', description: 'Regional area' }
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
    </div>
  );
};

export default RadiusSelector;
