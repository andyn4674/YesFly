import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
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

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      console.log('CLICK', e.latlng);
      onMapClick(e);
    }
  });
  return null;
}

const MapSelector = ({ onLocationChange, initialPosition = [40.7128, -74.0060] }) => {
  const [position, setPosition] = useState(initialPosition);
  const [selectedPosition, setSelectedPosition] = useState(null);

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    console.log('Map clicked at:', lat, lng);
    setPosition([lat, lng]);
    setSelectedPosition([lat, lng]);
  };

  const handleSubmitLocation = async () => {
    if (!selectedPosition) {
      alert('Please click on the map to select a location first');
      return;
    }

    const [lat, lng] = selectedPosition;

    try {
      // Use OpenStreetMap Nominatim to reverse geocode coordinates to address
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      
      const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      
      onLocationChange({
        type: 'Map Selection',
        coordinates: { latitude: lat, longitude: lng },
        address: address
      });
    } catch (error) {
      console.error('Error getting address:', error);
      onLocationChange({
        type: 'Map Selection',
        coordinates: { latitude: lat, longitude: lng },
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      });
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPosition([latitude, longitude]);
        // Just move the map to current location, don't submit
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your current location');
      }
    );
  };

  return (
    <div className="map-selector">
      <div className="map-controls">
        <button 
          onClick={getCurrentLocation}
          className="current-location-btn"
        >
          Go to Current Location
        </button>
      </div>

      <div className="map-container">
        <div className="map-instruction">
          Click anywhere on the map to select a location
        </div>
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '400px', width: '100%', borderRadius: '8px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          <Marker position={position}>
            <Popup>
              Selected location: {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </Popup>
          </Marker>
        </MapContainer>
        
        <div className="map-submit">
          <button 
            onClick={handleSubmitLocation}
            className="submit-location-btn"
          >
            Submit Selected Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapSelector;
