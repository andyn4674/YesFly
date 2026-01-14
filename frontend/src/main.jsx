import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import CheckRestrictions from './pages/CheckRestrictions.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="check-restrictions" element={<CheckRestrictions />} />
          <Route path="home" element={<Home />} />
          <Route path="supported-areas" element={<div>Supported Areas Page</div>} />
          <Route path="about" element={<div>About Page</div>} />
          <Route path="contact" element={<div>Contact Page</div>} />
        </Route>
      </Routes>
    </Router>
  </StrictMode>
);
