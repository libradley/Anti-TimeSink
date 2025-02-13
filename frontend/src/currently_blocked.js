import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function CurrentlyBlocked() {
  const [blockedWebsites, setBlockedWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    axios.get('http://localhost:5000/current_block')
    .then(response => {
      setBlockedWebsites(response.data);
      setLoading(false);
    })
    .catch(error => {
      console.error('Sorry! We are unable to retreive the currently blocked websites.', error);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1>List of Blocked Websites</h1>
      {loading ? (
        <p>Currently Loading...</p>
      ) : (
        <ul>
          {blockedWebsites.map((website) => (
            <li key={website.id} className="current_block">
              <p><strong>URL:</strong> {website.url}</p>
              <p><strong>Start Time:</strong> {website.start_time}</p>
              <p><strong>End Time:</strong> {website.end_time}</p>
              <p><strong>Selected Days:</strong> {website.selected_days}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
export default CurrentlyBlocked;