import React, { useState, useEffect } from 'react';
import { SnackbarProvider, useSnackbar } from 'notistack';
import './App.css'; // Import the CSS file
import axios from 'axios';

function CurrentlyBlocked() {
  const [blockedWebsites, setBlockedWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editWebsite, setEditWebsite] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const [formData, setFormData] = useState({
    url: '',
    start_time: '',
    end_time: '',
    selected_days: {
      Mon: false,
      Tue: false,
      Wed: false,
      Thu: false,
      Fri: false,
      Sat: false,
      Sun: false,
    }
  });
  
  useEffect(() => {
    axios.get('http://127.0.0.1:5000/current_block')
      .then(response => {
        setBlockedWebsites(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Sorry! We are unable to retrieve the currently blocked websites.', error);
        enqueueSnackbar('Sorry! We are unable to retrieve the currently blocked websites.', { variant: 'error' });
        setLoading(false);
      });
  }, [enqueueSnackbar]);

  // Handle input changes for the update form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Handle checkbox changes for selected days
  const handleCheckboxChange = (day) => {
    setFormData(prevState => ({
      ...prevState,
      selected_days: {
        ...prevState.selected_days,
        [day]: !prevState.selected_days[day]
      }
    }));
  };

  // Handle the update of a blocked website
  const handleUpdate = (websiteId) => {
    const updatedFormData = {
      ...formData,
      selected_days: Object.keys(formData.selected_days).filter(day => formData.selected_days[day]).join(',')  // Convert selected days to comma-separated string
    };
  
    axios.put(`http://127.0.0.1:5000/current_block/${websiteId}`, updatedFormData)
      .then(response => {
        setBlockedWebsites(prevWebsites =>
          prevWebsites.map(website =>
            website.id === websiteId ? { ...website, ...formData, selected_days: updatedFormData.selected_days.split(',') } : website
          )
        );
        setEditWebsite(null);  // Close the edit form
        enqueueSnackbar('Website updated successfully', { variant: 'success' });
      })
      .catch(error => {
        console.error('Error updating website:', error);
        enqueueSnackbar('Error updating website', { variant: 'error' });
      });
  };

  // Handle the deletion of a blocked website
  const handleDelete = (websiteId) => {
    console.log('Deleting website with ID:', websiteId);
    axios.delete(`http://127.0.0.1:5000/current_block/${websiteId}`)
      .then(() => {
        setBlockedWebsites(prevWebsites => 
          prevWebsites.filter(website => website.id !== websiteId)
        );
        enqueueSnackbar('Website deleted successfully', { variant: 'success' });
      })
      .catch(error => {
        console.error('Error deleting website:', error);
        enqueueSnackbar('Error deleting website', { variant: 'error' });
      });
  };

  // Handle the edit button click
  const handleEdit = (website) => {
    setEditWebsite(website.id);
    setFormData({
      url: website.url,
      start_time: website.start_time,
      end_time: website.end_time,
      selected_days: website.selected_days.reduce((acc, day) => {
        acc[day] = true;
        return acc;
      }, {
        Mon: false,
        Tue: false,
        Wed: false,
        Thu: false,
        Fri: false,
        Sat: false,
        Sun: false,
      })
    });
  };

  const formatDays = (selected_days) => {
    return Array.isArray(selected_days) ? selected_days.join(', ') : selected_days;
  };

  return (
    <div className="currently_blocked-container">
      <h1 className="currently_blocked-title">Blocked Webpages</h1>
      <div className="currently_blocked-table-wrapper">
        <table className="currently_blocked-table">
          <thead>
            <tr>
              <th>URL</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Days</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {blockedWebsites.map((website) => (
              <tr key={website.id}>
                {editWebsite === website.id ? (
                  <>
                    <td>
                      <input
                        type="text"
                        name="url"
                        value={formData.url}
                        onChange={handleInputChange}
                        className="table-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="start_time"
                        value={formData.start_time}
                        onChange={handleInputChange}
                        className="table-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="end_time"
                        value={formData.end_time}
                        onChange={handleInputChange}
                        className="table-input"
                      />
                    </td>
                    <td>
                      <div className="days-container">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                          <div key={day} className="day-option">
                            <input
                              type="checkbox"
                              id={day}
                              checked={formData.selected_days[day]}
                              onChange={() => handleCheckboxChange(day)}
                            />
                            <label htmlFor={day}>{day}</label>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <button className="save-button" onClick={() => handleUpdate(website.id)}>Save</button>
                    </td>
                    <td>
                      <button className="cancel-button" onClick={() => setEditWebsite(null)}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{website.url}</td>
                    <td>{website.start_time}</td>
                    <td>{website.end_time}</td>
                    <td>{formatDays(website.selected_days)}</td>
                    <td>
                      <button className="edit-button" onClick={() => handleEdit(website)}>Edit</button>
                    </td>
                    <td>
                      <button className="delete-button" onClick={() => handleDelete(website.id)}>Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const App = () => (
  <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
    <CurrentlyBlocked />
  </SnackbarProvider>
);

export default App;