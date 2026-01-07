import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { RestrictionCategory, RestrictionType } from '@shared/types/RestrictionLayer';
import 'leaflet/dist/leaflet.css';

// Import Leaflet images for Vite compatibility
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const MapVisualization = ({ locationData, restrictions, radius = 1000 }) => {
  const [mapCenter, setMapCenter] = useState([37.7749, -122.4194]);
  const [mapZoom, setMapZoom] = useState(13);

  useEffect(() => {
    console.log('MapVisualization props:', { locationData, restrictions, radius });
    if (locationData?.coordinates) {
      setMapCenter([locationData.coordinates.latitude, locationData.coordinates.longitude]);
      setMapZoom(14);
    }
  }, [locationData]);

  // Style functions for different restriction types
  const getSearchAreaStyle = () => ({
    color: '#3b82f6',
    weight: 2,
    fillColor: '#3b82f6',
    fillOpacity: 0.1,
    dashArray: '5, 5'
  });

  const getAirspaceStyle = () => ({
    color: '#ef4444',
    weight: 2,
    fillColor: '#ef4444',
    fillOpacity: 0.3
  });

  const getLocalStyle = () => ({
    color: '#f59e0b',
    weight: 2,
    fillColor: '#f59e0b',
    fillOpacity: 0.3
  });

  const getAllowedStyle = () => ({
    color: '#10b981',
    weight: 2,
    fillColor: '#10b981',
    fillOpacity: 0.2
  });

  // Popup content generators
  const createAirspacePopup = (feature) => {
    const props = feature.properties;
    return `
      <div style="font-family: Arial, sans-serif; font-size: 12px;">
        <h4 style="margin: 0 0 5px 0; color: #ef4444;">${props.name}</h4>
        <p style="margin: 0 0 5px 0;"><strong>Category:</strong> ${props.category}</p>
        <p style="margin: 0 0 5px 0;"><strong>Source:</strong> ${props.source}</p>
        <p style="margin: 0 0 5px 0;"><strong>Effective:</strong> ${new Date(props.effectiveDate).toLocaleDateString()}</p>
        <p style="margin: 0;"><strong>Notes:</strong> ${props.notes}</p>
      </div>
    `;
  };

  const createLocalPopup = (feature) => {
    const props = feature.properties;
    return `
      <div style="font-family: Arial, sans-serif; font-size: 12px;">
        <h4 style="margin: 0 0 5px 0; color: #f59e0b;">${props.name}</h4>
        <p style="margin: 0 0 5px 0;"><strong>Category:</strong> ${props.category}</p>
        <p style="margin: 0 0 5px 0;"><strong>City:</strong> ${props.city}</p>
        <p style="margin: 0;"><strong>Notes:</strong> ${props.notes}</p>
      </div>
    `;
  };

  const createAllowedPopup = (feature, index) => {
    return `
      <div style="font-family: Arial, sans-serif; font-size: 12px;">
        <h4 style="margin: 0 0 5px 0; color: #10b981;">Allowed Flight Area ${index + 1}</h4>
        <p style="margin: 0;"><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">SAFE TO FLY</span></p>
      </div>
    `;
  };

  if (!locationData) {
    return (
      <div className="map-visualization">
        <div className="map-header">
          <h3>Flight Restriction Map</h3>
        </div>
        <div className="map-placeholder">
          <p>Select a location and radius to view flight restrictions on the map.</p>
        </div>
      </div>
    );
  }

  if (!restrictions) {
    return (
      <div className="map-visualization">
        <div className="map-header">
          <h3>Flight Restriction Map</h3>
          <div className="map-info">
            <span className="radius">Search Radius: {radius} mi</span>
            <span className="coordinates">
              {locationData.coordinates.latitude.toFixed(6)}, {locationData.coordinates.longitude.toFixed(6)}
            </span>
          </div>
        </div>
        <div className="map-placeholder">
          <p>Loading flight restrictions for {locationData.address || 'selected location'}...</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-visualization">
      <div className="map-header">
        <h3>Flight Restriction Map</h3>
        <div className="map-info">
          <span className="radius">Search Radius: {radius} mi</span>
          <span className="coordinates">
            {locationData.coordinates.latitude.toFixed(6)}, {locationData.coordinates.longitude.toFixed(6)}
          </span>
        </div>
      </div>

      <div className="map-container">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '500px', width: '100%', borderRadius: '8px' }}
          scrollWheelZoom={true}
          whenCreated={(map) => {
            // Ensure the map is properly initialized
            setTimeout(() => {
              map.invalidateSize();
            }, 100);
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Search Area */}
          {restrictions.searchArea?.features?.length > 0 && (
            <GeoJSON
              data={restrictions.searchArea}
              style={getSearchAreaStyle}
              key={`search-area-${Date.now()}`}
            >
              <Popup>
                  <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#3b82f6' }}>Search Area</h4>
                    <p style={{ margin: '0 0 5px 0' }}><strong>Radius:</strong> {radius}</p>
                    <p style={{ margin: '0' }}><strong>Center:</strong> {locationData.coordinates.latitude.toFixed(6)}, {locationData.coordinates.longitude.toFixed(6)}</p>
                  </div>
              </Popup>
            </GeoJSON>
          )}

          {/* Airspace Restrictions */}
          {restrictions.airspaceRestrictions?.features?.length > 0 && (
            <GeoJSON
              data={restrictions.airspaceRestrictions}
              style={getAirspaceStyle}
              key={`airspace-layer`}
            >
              {restrictions.airspaceRestrictions.features.map((feature, index) => (
                <Popup key={`airspace-popup-${index}`}>
                  <div dangerouslySetInnerHTML={{ __html: createAirspacePopup(feature) }} />
                </Popup>
              ))}
            </GeoJSON>
          )}

          
          {/* Allowed Areas */}
          {restrictions.allowedAreas?.features?.length > 0 && (
            <GeoJSON
              data={restrictions.allowedAreas}
              style={getAllowedStyle}
              key={`allowed`}
            >
              {restrictions.allowedAreas.features.map((feature, index) => (
                <Popup key={`allowed-popup-${index}`}>
                  <div dangerouslySetInnerHTML={{ __html: createAllowedPopup(feature, index) }} />
                </Popup>
              ))}
            </GeoJSON>
          )}

          {/* Center Marker */}
          <Marker position={mapCenter}>
            <Popup>
              <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
                <h4 style={{ margin: '0 0 5px 0' }}>Selected Location</h4>
                <p style={{ margin: '0 0 5px 0' }}><strong>Coordinates:</strong> {mapCenter[0].toFixed(6)}, {mapCenter[1].toFixed(6)}</p>
                <p style={{ margin: '0' }}><strong>Address:</strong> {locationData.address}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Legend */}
        <div className="map-legend">
          <h4>Legend</h4>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#3b82f6', border: '1px solid #3b82f6' }}></div>
              <span>Search Area (Buffer)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#ef4444', border: '1px solid #ef4444' }}></div>
              <span>FAA Airspace Restrictions</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#f59e0b', border: '1px solid #f59e0b' }}></div>
              <span>Local Restrictions</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#10b981', border: '1px solid #10b981' }}></div>
              <span>Allowed Flight Areas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="map-summary">
        <div className="summary-grid">
          <div className="summary-card airspace">
            <h4>Restricted Areas</h4>
            <p className="summary-value">{(restrictions.airspaceRestrictions?.features?.length || 0) + (restrictions.localRestrictions?.features?.length || 0)}</p>
          </div>
          <div className="summary-card allowed">
            <h4>Allowed Areas</h4>
            <p className="summary-value">{restrictions.allowedAreas?.features?.length || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapVisualization;
