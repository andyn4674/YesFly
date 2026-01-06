import React, { useState, useEffect } from 'react';
import './FlightRestrictions.css';
// Import shared types for type checking (will be used in TypeScript conversion)
import { RestrictionCategory, RestrictionType } from '@shared/types/RestrictionLayer';

const FlightRestrictions = ({ locationData, radius = 1000, onRadiusChange }) => {
  const [restrictions, setRestrictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (locationData && locationData.coordinates) {
      fetchRestrictions();
    }
  }, [locationData, radius]);

  const fetchRestrictions = async () => {
    if (!locationData?.coordinates) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/restrictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: locationData.coordinates.latitude,
          lng: locationData.coordinates.longitude,
          radius: radius
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRestrictions(data.data);
    } catch (err) {
      console.error('Error fetching restrictions:', err);
      setError('Failed to load flight restrictions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRadiusChange = (newRadius) => {
    if (onRadiusChange) {
      onRadiusChange(newRadius);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (!locationData) {
    return null;
  }

  if (loading) {
    return (
      <div className="flight-restrictions">
        <div className="restrictions-header">
          <h3>Flight Restrictions</h3>
        </div>
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading flight restrictions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flight-restrictions">
        <div className="restrictions-header">
          <h3>Flight Restrictions</h3>
        </div>
        <div className="error">
          <p>{error}</p>
          <button onClick={fetchRestrictions} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!restrictions) {
    return (
      <div className="flight-restrictions">
        <div className="restrictions-header">
          <h3>Flight Restrictions</h3>
        </div>
        <div className="no-data">
          <p>Click "Submit Selected Location" to load flight restrictions for this area.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flight-restrictions">
        <div className="restrictions-header">
          <h3>Flight Restrictions</h3>
          <div className="search-info">
            <span className="radius">Search Radius: {radius} mi</span>
            <span className="coordinates">
              {locationData.coordinates.latitude.toFixed(6)}, {locationData.coordinates.longitude.toFixed(6)}
            </span>
          </div>
        </div>

      <div className="restrictions-list">
        {(() => {
          // Combine and sort restrictions by type
          const allRestrictions = [
            ...restrictions.airspaceRestrictions.features.map(feature => ({ ...feature, type: 'airspace' })),
            ...restrictions.localRestrictions.features.map(feature => ({ ...feature, type: 'local' }))
          ];
          
          // Sort by type (airspace first, then local), then by name
          allRestrictions.sort((a, b) => {
            if (a.type !== b.type) {
              return a.type === 'airspace' ? -1 : 1;
            }
            // Use description as fallback if name is not available
            const nameA = a.properties.name || a.properties.description || '';
            const nameB = b.properties.name || b.properties.description || '';
            return nameA.localeCompare(nameB);
          });

          if (allRestrictions.length === 0) {
            return (
              <div className="no-restrictions">
                <p>No flight restrictions found in this area.</p>
              </div>
            );
          }

          return allRestrictions.map((restriction, index) => (
            <div key={index} className={`restriction-item-horizontal ${restriction.type}`}>
              <div className="restriction-header">
                <div className="restriction-type-indicator">
                  <div className={`color-dot ${restriction.type}`}></div>
                  <span className="restriction-type">
                    {restriction.type === 'airspace' ? 'FAA Airspace' : 'Local'}
                  </span>
                </div>
                <div className="restriction-info">
                  <span className="restriction-name">{restriction.properties.name}</span>
                  <span className="restriction-category">{restriction.properties.category}</span>
                </div>
              </div>
              <div className="restriction-details">
                {restriction.type === 'airspace' ? (
                  <>
                    <div className="detail-row">
                      <span className="label">Effective:</span>
                      <span className="value">{formatTime(restriction.properties.effectiveDate)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Source:</span>
                      <span className="value">{restriction.properties.source}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Notes:</span>
                      <span className="value">{restriction.properties.notes}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="detail-row">
                      <span className="label">City:</span>
                      <span className="value">{restriction.properties.city}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Source:</span>
                      <span className="value">{restriction.properties.source}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Notes:</span>
                      <span className="value">{restriction.properties.notes}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
};

export default FlightRestrictions;
