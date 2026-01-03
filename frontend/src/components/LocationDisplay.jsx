import React from 'react';

const LocationDisplay = ({ locationData }) => {
  if (!locationData) {
    return null;
  }

  return (
    <div className="location-display">
      <h3>Location Found</h3>
      <div className="location-info">
        <div className="info-row">
          <span className="label">Method:</span>
          <span className="value">
            {locationData.type === 'geolocation' ? 'GPS Geolocation' : 'Manual Search'}
          </span>
        </div>
        <div className="info-row">
          <span className="label">Coordinates:</span>
          <span className="value">
            {locationData.coordinates.latitude.toFixed(6)}, {locationData.coordinates.longitude.toFixed(6)}
          </span>
        </div>
        <div className="info-row">
          <span className="label">Address:</span>
          <span className="value address">{locationData.address}</span>
        </div>
      </div>
      
      <div className="map-links">
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${locationData.coordinates.latitude},${locationData.coordinates.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="map-link"
        >
          View on Google Maps
        </a>
        <a 
          href={`https://www.openstreetmap.org/?mlat=${locationData.coordinates.latitude}&mlon=${locationData.coordinates.longitude}#map=16/${locationData.coordinates.latitude}/${locationData.coordinates.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="map-link"
        >
          View on OpenStreetMap
        </a>
      </div>
    </div>
  );
};

export default LocationDisplay;
