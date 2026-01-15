import React from 'react';
import '../styles/components/RadiusSelector.css';

const RadiusSelector = ({ selectedRadius, onRadiusChange }) => {
  const radiusOptions = [
    { value: 0.09469697, label: '500 ft'}, // 0.01893939 for 100 ft
    { value: 0.25, label: '¼ mi'},
    { value: 0.5, label: '½ mi'},
    { value: 1, label: '1 mi'},
    { value: 2, label: '2 mi'},
    { value: 5, label: '5 mi'}
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
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default RadiusSelector;
