import React, { useState, useEffect } from 'react';
import { SnackbarProvider, useSnackbar } from 'notistack';
import './App.css'; // Import the CSS file

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const { enqueueSnackbar } = useSnackbar();

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/history');
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

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

  const handleBlock = async (index) => {
    const job = history[index];
    const data = {
      id: job.id,
      url: job.url,
      start_time: job.start_time,
      end_time: job.end_time,
      selected_days: job.selected_days.reduce((acc, day) => {
        acc[day] = true;
        return acc;
      }, {})
    };

    try {
      if (job.status === 'unblocked') {
        const response = await fetch('http://127.0.0.1:5000/reblock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: job.id }),
        });

        if (response.ok) {
          enqueueSnackbar('Website re-blocked successfully.', { variant: 'success' });
          fetchHistory();
        } else {
          enqueueSnackbar('Failed to re-block website.', { variant: 'error' });
        }
      } else {
        const response = await fetch('http://127.0.0.1:5000/check_block', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        if (result.exists) {
          enqueueSnackbar(result.message, { variant: 'info', anchorOrigin: { vertical: 'top', horizontal: 'left' } });
        } else {
          const blockResponse = await fetch('http://127.0.0.1:5000/block', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (blockResponse.ok) {
            enqueueSnackbar('Website blocked successfully.', { variant: 'success' });
            fetchHistory();
          } else {
            enqueueSnackbar('Failed to block website.', { variant: 'error' });
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar('Error blocking website.', { variant: 'error' });
    }
  };

  const formatDays = (selected_days) => {
    return selected_days.join(', ');
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
              <th>Status</th>
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
                <td>{job.status}</td>
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

const App = () => (
  <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
    <HistoryPage />
  </SnackbarProvider>
);

export default App;