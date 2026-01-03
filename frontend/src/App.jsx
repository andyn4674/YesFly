import { useState } from 'react'
import LocationInput from './components/LocationInput'
import LocationDisplay from './components/LocationDisplay'
import FlightRestrictions from './components/FlightRestrictions'
import './App.css'

function App() {
  const [locationData, setLocationData] = useState(null)

  const handleLocationChange = (data) => {
    setLocationData(data)
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>Drone Flight Restriction Checker</h1>
        <p>Find your location and check flight restrictions in your area</p>
      </header>
      
      <main className="app-main">
        <LocationInput onLocationChange={handleLocationChange} />
        <LocationDisplay locationData={locationData} />
        <FlightRestrictions locationData={locationData} radiusMeters={1000} />
      </main>
      
      <footer className="app-footer">
        <p>Backend API: Node.js + Express + Turf.js • Frontend: React + Leaflet</p>
      </footer>
    </div>
  )
}

export default App
