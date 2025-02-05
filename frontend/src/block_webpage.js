import React, { useState } from 'react';
import './App.css'; // Import external CSS file

const BlockWebpage = () => {
  const [url, setUrl] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedDays, setSelectedDays] = useState({
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

  const convertTo24Hour = (time, period) => {
    const [hours, minutes] = time.split(':').map(Number);
    let convertedHours = hours;

    if (period === 'AM' && hours === 12) convertedHours = 0;
    if (period === 'PM' && hours !== 12) convertedHours += 12;

    return `${String(convertedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const roundTo30Minutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const roundedMinutes = Math.round(totalMinutes / 30) * 30;
    const roundedHours = Math.floor(roundedMinutes / 60);
    const roundedMinutesRemaining = roundedMinutes % 60;
    return `${String(roundedHours).padStart(2, '0')}:${String(roundedMinutesRemaining).padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    const timePattern = /^([01]?[0-9]|1[0-2]):([0-5]?[0-9])$/;

    if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
      alert('Please enter time in HH:MM format');
      return;
    }

    const correctedStartTime = convertTo24Hour(startTime, startPeriod);
    const correctedEndTime = convertTo24Hour(endTime, endPeriod);

    const roundedStartTime = roundTo30Minutes(correctedStartTime);
    const roundedEndTime = roundTo30Minutes(correctedEndTime);

    console.log('Block URL:', url);
    console.log('Start Time:', roundedStartTime);
    console.log('End Time:', roundedEndTime);
    console.log('Selected Days:', selectedDays);
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
        <label htmlFor="startTime">Start Time:</label>
        <div className="time-selector">
          <input
            type="text"
            id="startTime"
            value={startTime}
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
        <label htmlFor="endTime">End Time:</label>
        <div className="time-selector">
          <input
            type="text"
            id="endTime"
            value={endTime}
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
                checked={selectedDays[day]}
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
