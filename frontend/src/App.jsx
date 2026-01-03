import { useState } from 'react'
import LocationInput from './components/LocationInput'
import LocationDisplay from './components/LocationDisplay'
import './App.css'

function App() {
  const [locationData, setLocationData] = useState(null)

  const handleLocationChange = (data) => {
    setLocationData(data)
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>Location Finder</h1>
        <p>Find your location using GPS or manual input</p>
      </header>
      
      <main className="app-main">
        <LocationInput onLocationChange={handleLocationChange} />
        <LocationDisplay locationData={locationData} />
      </main>
      
      <footer className="app-footer">
        <p>Uses OpenStreetMap Nominatim API for geocoding</p>
      </footer>
    </div>
  )
}

export default App
