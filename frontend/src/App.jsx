import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import './App.css'

function App() {
  
  return (
    <div className="App">
      <header className="app-header">
        <Header />
      </header>
      
      <main className="app-main">
        <Outlet />
      </main>
      
      <footer className="app-footer">
        <p>YesFly</p>
      </footer>
    </div>
  )
}

export default App
