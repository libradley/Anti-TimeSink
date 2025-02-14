import React, { useState, useEffect } from 'react';
import './App.css'; // Import the CSS file

const HistoryPage = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/history');
        const data = await response.json();
        setHistory(data);
      } catch (error) {
        console.error('Error fetching history:', error);
      }
    };

    fetchHistory();
  }, []);

  const handleBlock = (index) => {
    console.log('Blocking:', history[index]);
    // Implement block logic here
  };

  const formatDays = (start_time) => {
    return Object.entries(start_time)
      .filter(([day, isSelected]) => isSelected)
      .map(([day]) => day)
      .join(', ');
  };

  return (
    <div className="history-container">
      <h1 className="history-title">History of Blocked Websites</h1>
      <div className="history-table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>URL</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Days</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {history.map((job, index) => (
              <tr key={index}>
                <td>{job.url}</td>
                <td>{job.start_time}</td>
                <td>{job.end_time}</td>
                <td>{formatDays(job.selected_days)}</td>
                <td>
                  <button className="block-button" onClick={() => handleBlock(index)}>Block</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryPage;