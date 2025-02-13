import React, { useState } from 'react';
import './App.css'; // Import external CSS file

const BlockWebpage = () => {
  const [url, setUrl] = useState('');
  const [start_time, setStartTime] = useState('');
  const [end_time, setEndTime] = useState('');
  const [selected_days, setSelectedDays] = useState({
    Mon: false,
    Tue: false,
    Wed: false,
    Thu: false,
    Fri: false,
    Sat: false,
    Sun: false,
  });

  const [startPeriod, setStartPeriod] = useState('AM'); 
  const [endPeriod, setEndPeriod] = useState('AM'); 

  const handleCheckboxChange = (day) => {
    setSelectedDays((prevState) => ({
      ...prevState,
      [day]: !prevState[day],
    }));
  };

  const handleSubmit = async () => {
    const timePattern = /^([01]?[0-9]|1[0-2]):([0-5]?[0-9])$/;

    if (!timePattern.test(start_time) || !timePattern.test(end_time)) {
      alert('Please enter time in HH:MM format');
      return;
    }

    const data = {
      url,
      start_time: `${start_time} ${startPeriod}`,
      end_time: `${end_time} ${endPeriod}`,
      selected_days,
    };

    try {
      const response = await fetch('http://localhost:5000/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Website blocked successfully');
      } else {
        alert('Failed to block website');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error blocking website');
    }
  };

  return (
    <div className="container">
      <h1>Block Webpage</h1>
      <div className="input-group">
        <label htmlFor="url">Enter URL:</label>
        <input
          type="text"
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter the URL"
        />
      </div>

      <div className="input-group">
        <label htmlFor="start_time">Start Time:</label>
        <div className="time-selector">
          <input
            type="text"
            id="start_time"
            value={start_time}
            onChange={(e) => setStartTime(e.target.value)}
            placeholder="HH:MM"
          />
          <select id="startPeriod" value={startPeriod} onChange={(e) => setStartPeriod(e.target.value)}>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="end_time">End Time:</label>
        <div className="time-selector">
          <input
            type="end_time"
            id="end_time"
            value={end_time}
            onChange={(e) => setEndTime(e.target.value)}
            placeholder="HH:MM"
          />
          <select id="endPeriod" value={endPeriod} onChange={(e) => setEndPeriod(e.target.value)}>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>

      <div className="input-group">
        <label>Select Days:</label>
        <div className="days-container">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="day-option">
              <input
                type="checkbox"
                id={day}
                checked={selected_days[day]}
                onChange={() => handleCheckboxChange(day)}
              />
              <label htmlFor={day}>{day}</label>
            </div>
          ))}
        </div>
      </div>

      <button className="block-button" onClick={handleSubmit}>Block</button>
    </div>
  );
};

export default BlockWebpage;