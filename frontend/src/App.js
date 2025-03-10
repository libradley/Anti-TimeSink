import './App.css';
import { NavLink, BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';

// Import the BlockWebpage component
import BlockWebpage from './block_webpage';
import CurrentlyBlocked from './currently_blocked';
import StatisticsPage from './statistics';

function App() {
  return (
    <Router> {/* Wrap the whole app with Router */}
      <div className="App">
        <header className="App-header">
          <div className="grid-container">
            <NavLink to="/block_webpage" className={({ isActive }) => isActive ? "grid-item block-webpage active" : "grid-item block-webpage"}>Block Webpage</NavLink>
            <NavLink to="/currently_blocked" className={({ isActive }) => isActive ? "grid-item currently-blocked active" : "grid-item currently-blocked"}>Currently Blocked</NavLink>
            <NavLink to="/statistics" className={({ isActive }) => isActive ? "grid-item statistics active" : "grid-item statistics"}>Statistics</NavLink>
          </div>
        </header>

        <main>
          {/* Define Routes */}
          <Routes>
            <Route path="/" element={<Navigate to="/block_webpage" />} />
            <Route path="/currently_blocked" element={<CurrentlyBlocked />} />
            <Route path="/block_webpage" element={<BlockWebpage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;