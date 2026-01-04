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

      <div className="restrictions-grid">
        {/* Search Area */}
        <div className="restriction-card search-area">
          <div className="card-header">
            <div className="color-indicator search"></div>
            <h4>Search Area</h4>
          </div>
          <div className="card-content">
            <div className="restriction-info">
              <span className="label">Area:</span>
              <span className="value">
                {restrictions.searchArea.features.length > 0 
                  ? formatArea(restrictions.searchArea.features[0].properties?.areaSqMeters || 0)
                  : 'Calculating...'}
              </span>
            </div>
            <div className="restriction-info">
              <span className="label">Radius:</span>
              <span className="value">{radiusMeters} meters</span>
            </div>
          </div>
        </div>

        {/* Airspace Restrictions */}
        <div className="restriction-card airspace">
          <div className="card-header">
            <div className="color-indicator airspace"></div>
            <h4>FAA Airspace Restrictions</h4>
            <span className="count">({restrictions.airspaceRestrictions.features.length})</span>
          </div>
          <div className="card-content">
            {restrictions.airspaceRestrictions.features.length === 0 ? (
              <p className="no-restrictions">No airspace restrictions found in this area.</p>
            ) : (
              restrictions.airspaceRestrictions.features.map((restriction, index) => (
                <div key={index} className="restriction-item">
                  <div className="restriction-header">
                    <span className="restriction-name">{restriction.properties.name}</span>
                    <span className="restriction-category">{restriction.properties.category}</span>
                  </div>
                  <div className="restriction-details">
                    <div className="detail-row">
                      <span className="label">Area:</span>
                      <span className="value">{formatArea(restriction.properties.areaSqMeters)}</span>
                    </div>
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
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Local Restrictions */}
        <div className="restriction-card local">
          <div className="card-header">
            <div className="color-indicator local"></div>
            <h4>Local Restrictions</h4>
            <span className="count">({restrictions.localRestrictions.features.length})</span>
          </div>
          <div className="card-content">
            {restrictions.localRestrictions.features.length === 0 ? (
              <p className="no-restrictions">No local restrictions found in this area.</p>
            ) : (
              restrictions.localRestrictions.features.map((restriction, index) => (
                <div key={index} className="restriction-item">
                  <div className="restriction-header">
                    <span className="restriction-name">{restriction.properties.name}</span>
                    <span className="restriction-category">{restriction.properties.category}</span>
                  </div>
                  <div className="restriction-details">
                    <div className="detail-row">
                      <span className="label">Area:</span>
                      <span className="value">{formatArea(restriction.properties.areaSqMeters)}</span>
                    </div>
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
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Allowed Areas */}
        <div className="restriction-card allowed">
          <div className="card-header">
            <div className="color-indicator allowed"></div>
            <h4>Allowed Flight Areas</h4>
          </div>
          <div className="card-content">
            {restrictions.allowedAreas.features.length === 0 ? (
              <div className="no-allowed">
                <p className="warning">⚠️ No areas allow drone flight in this search radius.</p>
                <p className="note">Please select a different location or reduce the search radius.</p>
              </div>
            ) : (
              <>
                <div className="allowed-summary">
                  <span className="label">Total Allowed Area:</span>
                  <span className="value">
                    {restrictions.allowedAreas.features.reduce((total, feature) => 
                      total + (feature.properties?.areaSqMeters || 0), 0).toLocaleString()} m²
                  </span>
                </div>
                <div className="allowed-list">
                  {restrictions.allowedAreas.features.map((area, index) => (
                    <div key={index} className="allowed-item">
                      <span className="allowed-name">Area {index + 1}</span>
                      <span className="allowed-area">{formatArea(area.properties?.areaSqMeters || 0)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="legend">
        <h4>Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="color-box search"></div>
            <span>Search Area</span>
          </div>
          <div className="legend-item">
            <div className="color-box airspace"></div>
            <span>FAA Airspace Restrictions</span>
          </div>
          <div className="legend-item">
            <div className="color-box local"></div>
            <span>Local Restrictions</span>
          </div>
          <div className="legend-item">
            <div className="color-box allowed"></div>
            <span>Allowed Areas</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightRestrictions;
