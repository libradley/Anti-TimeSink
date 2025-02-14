import React, { useState, useEffect } from 'react';

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

  // This function handles the queries listed reverse chronological order to selected date.
  const fetchQueriesByDate = async () => {
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
  };

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

  // This function renders the pagination buttons.
  const renderPagination = () => {
    const pages = Array.from({ length: total_pages }, (_, i) => i + 1);
    return (
      <div className="pagination">
        {pages.map((page) => (
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
        ))}
      </div>
    );
  };

  return (
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
        </div>
      )}

      {selected_form === "queriesByDate" && (
        <form onSubmit={handleFormSubmit}>
          <h3>See queries in reverse chronological order back to specified date.</h3>
          <p>Select a date in the past and a number of queries to display per page.</p>
          <p>
            <label>
            Date:
            <input
              type="date"
              value={query_date}
              onChange={(e) => setQueryDate(e.target.value)}
              required
            />
            </label>
          </p>
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

      {queries_data.length > 0 && selected_form === "queriesByDate" && (
        <div>
          <table>
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
          {renderPagination()}
        </div>
      )}

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

      {top_queries_data && selected_form === "topQueriesByClient" && (
        <div>
          <h3>Top 10 Requested and Delivered Queries</h3>
          <table>
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

          <h3>Top 10 Requested and Blocked Queries</h3>
          <table>
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
      )}
    </div>
  );
};

export default StatisticsPage;