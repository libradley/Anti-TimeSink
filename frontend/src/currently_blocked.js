import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function CurrentlyBlocked() {
  const [blockedWebsites, setBlockedWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editWebsite, setEditWebsite] = useState(null);
  const [formData, setFormData] = useState({
    start_time: '',
    end_time: '',
    selected_days: ''
  });

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/current_block')
      .then(response => {
        setBlockedWebsites(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Sorry! We are unable to retrieve the currently blocked websites.', error);
        setLoading(false);
      });
  }, []);

  // Handle input changes for the update form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Handle the update of a blocked website
  const handleUpdate = (websiteId) => {
    axios.put(`http://127.0.0.1:5000/current_block/${websiteId}`, formData)
      .then(response => {
        setBlockedWebsites(prevWebsites =>
          prevWebsites.map(website =>
            website.id === websiteId ? { ...website, ...formData } : website
          )
        );
        setEditWebsite(null);  // Close the edit form
      })
      .catch(error => {
        console.error('Error updating website:', error);
      });
  };

  // Handle the deletion of a blocked website
  const handleDelete = (websiteId) => {
    axios.delete(`http://127.0.0.1:5000/current_block/${websiteId}`)
      .then(() => {
        setBlockedWebsites(prevWebsites => 
          prevWebsites.filter(website => website.id !== websiteId)
        );
      })
      .catch(error => {
        console.error('Error deleting website:', error);
      });
  };

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

              {/* Update and Delete Buttons */}
              <button onClick={() => setEditWebsite(website)}>Edit</button>
              <button onClick={() => handleDelete(website.id)}>Delete</button>

              {/* If the website is being edited, show the form */}
              {editWebsite && editWebsite.id === website.id && (
                <div>
                  <h3>Update Website Details</h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleUpdate(website.id);
                    }}
                  >
                    <div>
                      <label>Start Time: </label>
                      <input
                        type="text"
                        name="start_time"
                        value={formData.start_time}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label>End Time: </label>
                      <input
                        type="text"
                        name="end_time"
                        value={formData.end_time}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label>Selected Days: </label>
                      <input
                        type="text"
                        name="selected_days"
                        value={formData.selected_days}
                        onChange={handleInputChange}
                      />
                    </div>
                    <button type="submit">Update</button>
                    <button type="button" onClick={() => setEditWebsite(null)}>Cancel</button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CurrentlyBlocked;