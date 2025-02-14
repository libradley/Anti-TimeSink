import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

# In-memory data store for blocked websites
blocked_websites = []

@app.route('/block', methods=['POST'])
def block_website():
    """Successfully added blocked website"""
    data = request.json
    blocked_websites.append(data)
    return jsonify({"message": "Website blocked successfully"}), 201


@app.route('/history', methods=['GET'])
def get_history():
    """Updates History Page"""
    return jsonify(blocked_websites), 200

# New Routes for Statistics.js
# Distinct clients on the network
@app.route('/clients', methods=['GET'])
def get_clients():
    """Fetch the list of unique clients from the dns_log table"""
    # open the connection to the database
    conn = sqlite3.connect('dns_log.db')
    cursor = conn.cursor()

    # grab client data from the database
    cursor.execute("SELECT DISTINCT query_client FROM dns_log ORDER by query_client DESC")
    clients = [row[0] for row in cursor.fetchall()]

    # close the connection
    conn.close()
    return jsonify({'clients': clients}), 200

# Queries by date
@app.route('/queries_by_date', methods=['GET'])
def get_queries_by_date():
    """Fetch paginated query data based on the selected client and date range"""

    # sort out the parameters
    query_type_pattern = '%query%'  # Search only for queries with query in the type
    query_date = str(request.args.get('date')) # Date from front end
    start_time = f"{query_date} 00:00:00"  # Start of the day
    limit = int(request.args.get('limit', 10))  # Queries per page
    offset = int(request.args.get('offset', 0))  # Page number
    end_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')  # Current date

    # open the connection to the database
    conn = sqlite3.connect('dns_log.db')
    cursor = conn.cursor()

    # Query for paginated data
    query = """
        SELECT timestamp, query_type, query_domain, query_client
        FROM dns_log
        WHERE query_type LIKE ?
        AND timestamp BETWEEN ? AND ?
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
    """

    # grab the data from the database
    cursor.execute(query, (query_type_pattern, start_time, end_time, limit, offset))
    queries = cursor.fetchall()

    # Query for total count
    count_query = """
        SELECT COUNT(*)
        FROM dns_log
        WHERE query_type LIKE ?
        AND timestamp BETWEEN ? AND ?
    """

    # grab the data from the database
    cursor.execute(count_query, (query_type_pattern, start_time, end_time))
    total_queries = cursor.fetchone()[0]

    conn.close()

    # Prepare response
    return jsonify({
        "queries": [
            {
                "timestamp": row[0],
                "query_type": row[1],
                "query_domain": row[2],
                "query_client": row[3]
            } for row in queries
        ],
        "total_queries": total_queries
    }), 200

@app.route('/top_queries', methods=['GET'])
def get_top_queries():
    """Fetch the top queries for a specific client over a specified number of days"""
    client = request.args.get('client')
    days_ago = int(request.args.get('days_ago', 0))

    # Build the result object
    results = {'client': client}

    # Connect to the database
    conn = sqlite3.connect('dns_log.db')
    cursor = conn.cursor()

    # BUILD THE INFORMATION FOR THE TOP QUERIES:
    top_10_query = """
        SELECT query_domain, COUNT(*) as count
        FROM dns_log
        WHERE query_client = ? AND timestamp >= datetime('now', ? || ' days')
        GROUP BY query_domain
        ORDER BY count DESC
        LIMIT 10
    """
    # grab the data from the database
    cursor.execute(top_10_query, (client, -days_ago))
    top_queries = cursor.fetchall()

    # prepare results for requested queries
    results['requested'] = {
        "queries": [{ "domain": row[0], "count": row[1] } for row in top_queries]
    }

    # Grabs all queries that then result in a config response
    top_10_blocked = """
        SELECT t1.query_domain, COUNT(*) AS count
        FROM dns_log t1
        JOIN dns_log t2
        ON t1.id = t2.id - 1
        WHERE t2.query_type = 'config'
        AND t1.timestamp >= datetime('now', :days_ago || ' days')
        AND t1.query_client = :client
        GROUP BY t1.query_domain
        ORDER BY count DESC
        LIMIT 10;
    """
    # grab the data from the database
    cursor.execute(top_10_blocked, {'client': client, 'days_ago': -days_ago})
    top_blocked = cursor.fetchall()

    # prepare results for blocked queries
    results['requested_and_blocked'] = {
        "queries": [{ "domain": row[0], "count": row[1] } for row in top_blocked]
    }
    # close the connection
    conn.close()

    return jsonify(results), 200


if __name__ == '__main__':
    app.run(debug=True)
