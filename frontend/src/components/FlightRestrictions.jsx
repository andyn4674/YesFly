import React, { useState, useEffect } from 'react';
import './FlightRestrictions.css';

const FlightRestrictions = ({ locationData, radiusMeters = 1000, onRadiusChange }) => {
  const [restrictions, setRestrictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (locationData && locationData.coordinates) {
      fetchRestrictions();
    }
  }, [locationData, radiusMeters]);

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
          radiusMeters: radiusMeters
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

  const formatArea = (sqMeters) => {
    if (sqMeters >= 1000000) {
      return `${(sqMeters / 1000000).toFixed(2)} km²`;
    } else {
      return `${sqMeters.toFixed(0)} m²`;
    }
  };

  const formatAreaUS = (sqMeters, radiusMeters) => {
    // Use the unit converter for US customary units
    if (typeof window !== 'undefined') {
      try {
        // Import the unit converter dynamically
        const { unitConverter } = require('../utils/unitConverter');
        return unitConverter.formatAreaDisplay(sqMeters, radiusMeters);
      } catch (error) {
        // Fallback to simple conversion
        const sqMiles = sqMeters / 2589988;
        return sqMiles >= 1 ? `${sqMiles.toFixed(2)} sq mi` : `${sqMeters.toFixed(0)} m²`;
      }
    }
    return `${sqMeters.toFixed(0)} m²`;
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
            <span className="radius">Search Radius: {radiusMeters}m</span>
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
            return a.properties.name.localeCompare(b.properties.name);
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
                <div className="detail-row">
                  <span className="label">Area:</span>
                  <span className="value">{formatArea(restriction.properties.areaSqMeters)}</span>
                </div>
                {restriction.type === 'airspace' ? (
                  <>
                    <div className="detail-row">
                      <span className="label">Altitude:</span>
                      <span className="value">
                        {restriction.properties.altitudeMin}m - {restriction.properties.altitudeMax}m
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Effective:</span>
                      <span className="value">{formatTime(restriction.properties.effectiveDate)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Source:</span>
                      <span className="value">{restriction.properties.source}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="detail-row">
                      <span className="label">City:</span>
                      <span className="value">{restriction.properties.city}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Enforcement:</span>
                      <span className="value">{restriction.properties.enforcement}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Penalties:</span>
                      <span className="value">{restriction.properties.penalties}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Source:</span>
                      <span className="value">{restriction.properties.source}</span>
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
