import { useState } from 'react'
import LocationInput from './components/LocationInput'
import LocationDisplay from './components/LocationDisplay'
import FlightRestrictions from './components/FlightRestrictions'
import MapVisualization from './components/MapVisualization'
import RadiusSelector from './components/RadiusSelector'
import './App.css'

function App() {
  const [locationData, setLocationData] = useState(null)
  const [restrictions, setRestrictions] = useState(null)
  const [radius, setradius] = useState(1)

  const handleLocationChange = (data) => {
    console.log('📍 Location changed:', data);
    setLocationData(data)
    setRestrictions(null) // Clear previous restrictions when location changes
    
    console.log('📞 About to call fetchRestrictions with radius:', radius);
    
    // Trigger API call for the new location with current radius
    fetchRestrictions(radius, data);
    
    console.log('✅ fetchRestrictions called');
  }

  const handleRadiusChange = (newRadius) => {
    setradius(newRadius)
    if (locationData) {
      // Trigger new restriction check when radius changes
      fetchRestrictions(newRadius)
    }
  }

  const fetchRestrictions = async (radius = radius, locationDataOverride = null) => {
    // Use the passed location data or fall back to state
    const locationToUse = locationDataOverride || locationData;
    
    if (!locationToUse?.coordinates) return;

    console.log('Fetching restrictions for:', {
      lat: locationToUse.coordinates.latitude,
      lng: locationToUse.coordinates.longitude,
      radius: radius
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      console.log('Making API request...');

      console.log('About to make fetch request to:', 'http://localhost:3000/api/restrictions');
      console.log('Request body:', {
        lat: locationToUse.coordinates.latitude,
        lng: locationToUse.coordinates.longitude,
        radius: radius
      });

      const response = await fetch('http://localhost:3000/api/restrictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: locationToUse.coordinates.latitude,
          lng: locationToUse.coordinates.longitude,
          radius: radius
        }),
        signal: controller.signal
      });
      
      console.log('Fetch request completed, response:', response);

      clearTimeout(timeoutId);

      console.log('Response received:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      if (response.ok) {
        console.log('Parsing JSON response...');
        const data = await response.json();
        console.log('API response data:', data);
        console.log('Setting restrictions to:', data.data);
        setRestrictions(data.data);
      } else {
        console.error('Response not ok:', response.statusText);
        console.log('Setting restrictions to empty data due to failed response');
        // Set restrictions to empty data to show the map with no restrictions
        setRestrictions({
          searchArea: { type: 'FeatureCollection', features: [] },
          airspaceRestrictions: { type: 'FeatureCollection', features: [] },
          localRestrictions: { type: 'FeatureCollection', features: [] },
          allowedAreas: { type: 'FeatureCollection', features: [] }
        });
      }
    } catch (err) {
      console.error('Error fetching restrictions:', err);
      console.log('Setting restrictions to empty data due to error');
      // Set restrictions to empty data to show the map even if API fails
      setRestrictions({
        searchArea: { type: 'FeatureCollection', features: [] },
        airspaceRestrictions: { type: 'FeatureCollection', features: [] },
        localRestrictions: { type: 'FeatureCollection', features: [] },
        allowedAreas: { type: 'FeatureCollection', features: [] }
      });
    }
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>Drone Flight Restriction Checker</h1>
        <p>Find your location and check flight restrictions in your area</p>
      </header>
      
      <main className="app-main">
        <RadiusSelector 
          selectedRadius={radius} 
          onRadiusChange={handleRadiusChange}
        />
        <LocationInput onLocationChange={handleLocationChange} />
        <LocationDisplay locationData={locationData} />
        <FlightRestrictions 
          locationData={locationData} 
          radius={radius} 
          onRadiusChange={handleRadiusChange}
        />
        <MapVisualization 
          locationData={locationData} 
          restrictions={restrictions} 
          radius={radius}
        />
      </main>
      
      <footer className="app-footer">
        <p>Backend API: Node.js + Express + Turf.js • Frontend: React + Leaflet</p>
      </footer>
    </div>
  )
}

export default App
