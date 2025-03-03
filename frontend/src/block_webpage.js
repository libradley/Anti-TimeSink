import React, { useState } from 'react';
import './App.css'; // Import external CSS file

const BlockWebpage = () => {
  const [url, setUrl] = useState('');
  const [startHour, setStartHour] = useState('12');
  const [startMinute, setStartMinute] = useState('00');
  const [startPeriod, setStartPeriod] = useState('AM');
  const [endHour, setEndHour] = useState('12');
  const [endMinute, setEndMinute] = useState('00');
  const [endPeriod, setEndPeriod] = useState('AM');
  const [selected_days, setSelectedDays] = useState({
    Mon: false,
    Tue: false,
    Wed: false,
    Thu: false,
    Fri: false,
    Sat: false,
    Sun: false,
  });

  const handleCheckboxChange = (day) => {
    setSelectedDays((prevState) => ({
      ...prevState,
      [day]: !prevState[day],
    }));
  };

  const convertTo24Hour = (hour, minute, period) => {
    let hr = parseInt(hour);
    if (period === 'PM' && hr !== 12) {
      hr += 12;
    } else if (period === 'AM' && hr === 12) {
      hr = 0;
    }
    return `${String(hr).padStart(2, '0')}:${minute}`;
  };

  const handleSubmit = async () => {
    const startTime24 = convertTo24Hour(startHour, startMinute, startPeriod);
    const endTime24 = convertTo24Hour(endHour, endMinute, endPeriod);
  
    if (startTime24 >= endTime24) {
      alert('Start time must be before end time.');
      return;
    }
  
    const data = {
      url,
      start_time: `${startHour}:${startMinute} ${startPeriod}`,
      end_time: `${endHour}:${endMinute} ${endPeriod}`,
      selected_days: selected_days,  // Send selected_days as a dictionary
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
        // Reset form fields to initial values
        setUrl('');
        setStartHour('12');
        setStartMinute('00');
        setStartPeriod('AM');
        setEndHour('12');
        setEndMinute('00');
        setEndPeriod('AM');
        setSelectedDays({
          Mon: false,
          Tue: false,
          Wed: false,
          Thu: false,
          Fri: false,
          Sat: false,
          Sun: false,
        });
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
          <select id="startHour" value={startHour} onChange={(e) => setStartHour(e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                {String(i + 1).padStart(2, '0')}
              </option>
            ))}
          </select>
          :
          <select id="startMinute" value={startMinute} onChange={(e) => setStartMinute(e.target.value)}>
            {Array.from({ length: 60 }, (_, i) => (
              <option key={i} value={String(i).padStart(2, '0')}>
                {String(i).padStart(2, '0')}
              </option>
            ))}
          </select>
          <select id="startPeriod" value={startPeriod} onChange={(e) => setStartPeriod(e.target.value)}>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="end_time">End Time:</label>
        <div className="time-selector">
          <select id="endHour" value={endHour} onChange={(e) => setEndHour(e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                {String(i + 1).padStart(2, '0')}
              </option>
            ))}
          </select>
          :
          <select id="endMinute" value={endMinute} onChange={(e) => setEndMinute(e.target.value)}>
            {Array.from({ length: 60 }, (_, i) => (
              <option key={i} value={String(i).padStart(2, '0')}>
                {String(i).padStart(2, '0')}
              </option>
            ))}
          </select>
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