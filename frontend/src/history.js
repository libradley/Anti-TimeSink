import React, { useState } from 'react';
import './App.css'; // Import the CSS file

const HistoryPage = () => {
  const [history, setHistory] = useState([
    { url: 'www.facebook.com', startTime: '7AM', endTime: '9AM' },
    { url: 'www.instagram.com', startTime: '5PM', endTime: '9PM' },
    { url: 'www.tiktok.com', startTime: '11AM', endTime: '12PM' },
    { url: 'www.coolmathgames.com', startTime: '8AM', endTime: '5PM' },
    { url: 'www.work.com', startTime: '12AM', endTime: '11PM' },
    { url: 'www.twitter.com', startTime: '6AM', endTime: '8AM' },
    { url: 'www.reddit.com', startTime: '9PM', endTime: '11PM' },
    { url: 'www.youtube.com', startTime: '10AM', endTime: '1PM' },
    { url: 'www.netflix.com', startTime: '7PM', endTime: '11PM' },
    { url: 'www.discord.com', startTime: '3PM', endTime: '6PM' },
  ]);

  const handleBlock = (index) => {
    console.log('Blocking:', history[index]);
    // Implement block logic here
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
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {history.map((job, index) => (
              <tr key={index}>
                <td>{job.url}</td>
                <td>{job.startTime}</td>
                <td>{job.endTime}</td>
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
