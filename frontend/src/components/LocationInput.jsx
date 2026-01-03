import { useState } from 'react';
import MapSelector from './MapSelector';

const LocationInput = ({ onLocationChange }) => {
  const [location, setLocation] = useState('');
  const [isUsingGeolocation, setIsUsingGeolocation] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);

  const handleGeolocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    setIsUsingGeolocation(true);
    
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      const { latitude, longitude } = position.coords;
      
      // Use OpenStreetMap Nominatim to reverse geocode coordinates to address
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      
      const address = data.display_name || `${latitude}, ${longitude}`;
      
      onLocationChange({
        type: 'geolocation',
        coordinates: { latitude, longitude },
        address: address
      });
      
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Unable to get your location. Please try manual input.');
    } finally {
      setIsUsingGeolocation(false);
    }
  };

  const handleManualInput = async (e) => {
    e.preventDefault();
    if (!location.trim()) return;

    try {
      // Use OpenStreetMap Nominatim to geocode address to coordinates
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const coordinates = {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon)
        };
        
        onLocationChange({
          type: 'manual',
          coordinates: coordinates,
          address: result.display_name
        });
      } else {
        alert('Location not found. Please try a more specific address.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      alert('Error searching for location. Please try again.');
    }
  };

  return (
    <div className="location-input">
      <h2>Find Your Location</h2>
      
      <div className="method-selector">
        <button 
          onClick={() => setSelectedMethod(selectedMethod === 'geolocation' ? null : 'geolocation')}
          className={`method-btn ${selectedMethod === 'geolocation' ? 'active' : ''}`}
        >
          📍 Use My Current Location
        </button>
        
        <button 
          onClick={() => setSelectedMethod(selectedMethod === 'manual' ? null : 'manual')}
          className={`method-btn ${selectedMethod === 'manual' ? 'active' : ''}`}
        >
          🖊️ Type Address
        </button>
        
        <button 
          onClick={() => setSelectedMethod(selectedMethod === 'map' ? null : 'map')}
          className={`method-btn ${selectedMethod === 'map' ? 'active' : ''}`}
        >
          🗺️ Choose on Map
        </button>
      </div>

      {selectedMethod === 'geolocation' && (
        <div className="method-content">
          <button 
            onClick={handleGeolocation} 
            disabled={isUsingGeolocation}
            className="geo-btn"
          >
            {isUsingGeolocation ? 'Getting Location...' : 'Get My Location'}
          </button>
        </div>
      )}

      {selectedMethod === 'manual' && (
        <div className="method-content">
          <form onSubmit={handleManualInput} className="manual-input">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter address, city, or coordinates"
              className="location-input-field"
            />
            <button type="submit" className="search-btn">
              Search
            </button>
          </form>
        </div>
      )}

      {selectedMethod === 'map' && (
        <div className="method-content">
          <MapSelector onLocationChange={onLocationChange} />
        </div>
      )}
    </div>
  );
};

export default LocationInput;
