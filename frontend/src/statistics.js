import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, Tooltip, CartesianGrid, Legend } from 'recharts';

const StatisticsPage = () => {
  // This function loads the statistics page.
  const host_url = "http://127.0.0.1:5000";  // Host URL for the API Server

  // Use state constant definitions:
  const [selected_form, setSelectedForm] = useState(null);
  const [query_date, setQueryDate] = useState("");
  const [queries_per_page, setQueriesPerPage] = useState(10); // Default queries per page
  const [current_page, setCurrentPage] = useState(1);
  const [queries_data, setQueriesData] = useState([]);
  const [total_pages, setTotalPages] = useState(0);

  const [client, setClient] = useState("");
  const [days_ago, setDaysAgo] = useState(0);
  const [top_queries_data, setTopQueriesData] = useState(null);
  const [clients, setClients] = useState([]);   // For dropdown list of clients
  // graph states
  const [graph_data, setGraphData] = useState([]);
  const [query_type_data, setQueryTypeData] = useState([]);

  // This function fetches the list of clients from the API endpoint and sets the state.
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch(`${host_url}/clients`);   // API endpoint to get clients
        const data = await response.json();
        setClients(data.clients);
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };
    fetchClients();
  }, []);

  //////////////////////////
  // Graphical Data pie chart
  useEffect(() => {
    const fetchQueryTypeData = async () => {
      try {
        const response = await fetch(`${host_url}/query_type_breakdown`);
        const data = await response.json();

        // change data into array for recharts
        const formattedData = Object.entries(data).map(([key, value]) => ({
          name: key,
          value: value,
        }));

        setQueryTypeData(formattedData);
      } catch (error) {
        console.error("Error fetching query type data:", error);
      }
    };

    // Fetch graph data immediately on component mount
    fetchQueryTypeData();

    // Set up interval to fetch graph data every 15 minutes
    const interval = setInterval(() => {
      fetchQueryTypeData();
    }, 15 * 60 * 1000); // 15 minutes in milliseconds

    // Clear interval on component unmount to prevent memory leaks
    return () => clearInterval(interval);
  }, []); // Empty dependency array to only set up interval once

  //////////////////////////
  // Graphical Data bar chart
  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const response = await fetch(`${host_url}/query_graph`);
        const data = await response.json();
        setGraphData(data);
      } catch (error) {
        console.error("Error fetching graph data:", error);
      }
    };

    // Fetch graph data immediately on component mount
    fetchGraphData();

    // Set up interval to fetch graph data every 15 minutes
    const interval = setInterval(() => {
      fetchGraphData();
    }, 15 * 60 * 1000); // 15 minutes in milliseconds

    // Clear interval on component unmount to prevent memory leaks
    return () => clearInterval(interval);
  }, []);

  // QUERY GRAPH
  const QueryGraph = ({ data }) => {
    return (
      // Bar chart for last 24 hours queries allowed and blocked
      <div className="grid-container">
        <BarChart width={800} height={300} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="allowed" fill="#004225" />
          <Bar dataKey="blocked" fill="#FF0000" />
        </BarChart>
      </div>
    )
  };

  const QueryTypePie = ({ data }) => {
    const COLORS = [
      '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
      '#845EC2', '#FF6F91', '#FFC75F', '#F9F871', '#D65DB1'
    ];

    return (
      // Pie chart for last 24 hours query type breakdown
      <div className="grid-container">
        <PieChart width={800} height={300}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend layout="vertical" align="right" vertical_align="top"/>
        </PieChart>
      </div>
    );
  }

  // This function handles the queries listed reverse chronological order to selected date.
  const fetchQueriesByDate = useCallback(async () => {
    try {
      // Find offset and send request to API endpoint
      const offset = (current_page - 1) * queries_per_page;
      const response = await fetch(
        `${host_url}/queries_by_date?date=${query_date}&limit=${queries_per_page}&offset=${offset}`
      );

      // Parse the response and set the state
      const data = await response.json();
      setQueriesData(data.queries);
      setTotalPages(Math.ceil(data.total_queries / queries_per_page));

    } catch (error) {
      console.error("Error fetching queries by date:", error);
    }
  }, [current_page, queries_per_page, host_url, query_date]);

  // useEffect to re-fetch queries when current_page changes
  useEffect(() => {
    if (selected_form === "queriesByDate" && query_date) {
      fetchQueriesByDate();
    }
  }, [current_page, selected_form, fetchQueriesByDate, query_date]);

  // This function handles the top queries by client.
  const fetchTopQueriesByClient = async () => {
    try {
      // send request to API endpoint
      const response = await fetch(
        `${host_url}/top_queries?client=${client}&days_ago=${days_ago}`
      );

      // Parse the response and set the state
      const data = await response.json();
      setTopQueriesData(data);

    } catch (error) {
      console.error("Error fetching top queries by client:", error);
    }
  };

  // This function handles the form submission.
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (selected_form === "queriesByDate") {
      fetchQueriesByDate();
    } else if (selected_form === "topQueriesByClient") {
      fetchTopQueriesByClient();
    }
  };

  const renderPagination = () => {
    const maxPagesToShow = 5; // Limit the number of buttons shown
    let startPage = Math.max(1, current_page - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(total_pages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    const pages = new Set(); // Use a Set to prevent duplicate values

    pages.add(1); // Always include first page
    if (startPage > 2) pages.add("..."); // Ellipsis before main range

    for (let i = startPage; i <= endPage; i++) {
      pages.add(i);
    }

    if (endPage < total_pages - 1) pages.add("..."); // Ellipsis after main range
    pages.add(total_pages); // Always include last page

    return (
      <div className="pagination">
        <button
          disabled={current_page === 1}
          onClick={() => {
            setCurrentPage(current_page - 1);
            fetchQueriesByDate();
          }}
        >
          Prev
        </button>

        {[...pages].map((page, index) =>
          page === "..." ? (
            <span key={`ellipsis-${index}`} className="ellipsis">...</span>
          ) : (
            <button
              key={page}
              onClick={() => {
                setCurrentPage(page);
                fetchQueriesByDate();
              }}
              className={page === current_page ? "active" : ""}
            >
              {page}
            </button>
          )
        )}

        <button
          disabled={current_page === total_pages}
          onClick={() => {
            setCurrentPage(current_page + 1);
            fetchQueriesByDate();
          }}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    // Initial statistics page with buttons to select and graphs provided
    <div>
      <h1>DNS Server Statistics</h1>

      {!selected_form && (
        <div>
          <div>
            <h3>See queries in reverse chronological order back to specified date.</h3>
            <button onClick={() => setSelectedForm("queriesByDate")}>
              Queries By Date
            </button>
          </div>
          <div>
            <h3>See queries by client, top ten allowed and top ten blocked.</h3>
            <button onClick={() => setSelectedForm("topQueriesByClient")}>
              Top Queries By Client
            </button>
          </div>
          <div>
            <h3>Last 24 hour Query Statistics</h3>
            <QueryGraph data={graph_data} />
          </div>
          <div className="chart-container">
            <h3>Query Breakdown (last 24 hours)</h3>
            <QueryTypePie data={query_type_data} />
          </div>
        </div>
      )}

      {/* Form for the queries by date */}
      {selected_form === "queriesByDate" && (
        <form onSubmit={handleFormSubmit}>
          <h3>See queries in reverse chronological order back to specified date.</h3>
          <p>Select a date in the past and a number of queries to display per page.</p>
          <p>
            <label>
              Queries Per Page:
              <select
                value={queries_per_page}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  console.log("selected queries per page:", value);
                  setQueriesPerPage(value);
                }}
                required
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </label>
          </p>
          <p>
            <label>
            Date:
            <input
              type="date"
              value={query_date}
              onChange={(e) => setQueryDate(e.target.value)}
              required
              className="table-input"
            />
            </label>
          </p>
          <button type="submit">Submit</button>
          <button onClick={() => {
            setSelectedForm(null)
            setQueriesPerPage(10)
            setQueryDate("")
            setCurrentPage(1)
            setQueriesData([])
            setTotalPages(0)
            }}>Back</button>
        </form>
      )}

      {/* Build out table for the queries by date */}
      {queries_data.length > 0 && selected_form === "queriesByDate" && (
        <div className="stats-container">
          <h1 className="stats-title">Queries from now until selected date:</h1>
          <div className="stats-table-wrapper">
            <table className="stats-table">
            <thead>
              <tr>
                <th>Date Time</th>
                <th>Type</th>
                <th>Domain</th>
                <th>Client</th>
              </tr>
            </thead>
            <tbody>
              {queries_data.map((query, index) => (
                <tr key={index}>
                  <td>{query.timestamp}</td>
                  <td>{query.query_type}</td>
                  <td>{query.query_domain}</td>
                  <td>{query.query_client}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          {renderPagination()}
        </p>
        </div>
      )}

      {/* Form for the queries by client */}
      {selected_form === "topQueriesByClient" && (
        <form onSubmit={handleFormSubmit}>
          <h3>See queries by client, top ten allowed and top ten blocked.</h3>
          <p>Select a client and a number of days to examine going back from today.</p>
          <p>
            <label>
              Client:
              <select
                value={client}
                onChange={(e) => {
                  setClient(e.target.value)
                }}
                required
              >
                <option value="">Select a Client</option>
                {clients.map((client, index) => (
                  <option key={index} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            </label>
          </p>
          <p>
            <label>
              Days Ago through Today:
              <input
                type="number"
                value={days_ago}
                onChange={(e) => {setDaysAgo(Number(e.target.value))}}

                required
              />
            </label>
          </p>
          <button type="submit">Submit</button>
          <button onClick={() => {
            setSelectedForm(null)
            setDaysAgo(0)
            setTopQueriesData(null)
            setClient("")
            }}>Back</button>
        </form>
      )}

      {/* Build out tables for top queries allowed and blocked
          by client and date range selected to now */}
      {top_queries_data && selected_form === "topQueriesByClient" && (
        <div className="stats-container">
          <h3 className="stats-title">Top 10 Requested Queries</h3>
          <div className="stats-table-wrapper">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {top_queries_data.requested.queries.map((query, index) => (
                  <tr key={index}>
                    <td>{query.domain}</td>
                    <td>{query.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="stats-title">Top 10 Requested and Blocked Queries</h3>
          <div className="stats-table-wrapper">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {top_queries_data.requested_and_blocked.queries.map((query, index) => (
                  <tr key={index}>
                    <td>{query.domain}</td>
                    <td>{query.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;