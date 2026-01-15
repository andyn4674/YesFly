import { useState } from 'react';
import LocationInput from '../components/LocationInput'
import FlightRestrictions from '../components/FlightRestrictions'
import MapVisualization from '../components/MapVisualization'
import RadiusSelector from '../components/RadiusSelector'
import '../styles/components/CheckRestrictions.css';

function CheckRestrictions () {
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
        <div className="check-restrictions-container">
            <div className="location-input-container">
                <LocationInput onLocationChange={handleLocationChange} />
                <RadiusSelector
                    selectedRadius={radius}
                    onRadiusChange={handleRadiusChange}
                />
            </div>
            <div className="map-visualization-container">
                <MapVisualization
                locationData={locationData}
                restrictions={restrictions}
                radius={radius}
                />
            </div>
            <div className="flight-restrictions-container">
                <FlightRestrictions
                locationData={locationData}
                radius={radius}
                onRadiusChange={handleRadiusChange}
                />
            </div>
        </div>
    )
}

export default CheckRestrictions;
