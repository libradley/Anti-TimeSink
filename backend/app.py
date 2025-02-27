import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import threading
import time
from update_cron_job import update_cron_jobs


app = Flask(__name__)
CORS(app)

# In-memory data store for blocked websites
blocked_websites = []


def init_db():
    try:
        connection = sqlite3.connect('timesink.db')
        cursor = connection.cursor()
        cursor.execute('''CREATE TABLE IF NOT EXISTS blocked_websites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            selected_days TEXT NOT NULL,
            status INTEGER NOT NULL)''')
        connection.commit()
        connection.close()
    except sqlite3.Error as e:
        print(f"Database initialization failed: {e}")
        raise


@app.route('/block', methods=['POST'])
def block_website():
    """Successfully added blocked website"""
    data = request.json
    selected_days = ','.join([day for day, selected in data['selected_days'].items() if selected])
    if not data.get('url') or not data.get('start_time') or not data.get('end_time') or not data.get('selected_days'):
        return jsonify({"error": "Missing required fields"}), 400
    try:
        connection = sqlite3.connect('timesink.db')
        cursor = connection.cursor()
        cursor.execute('''
            INSERT INTO blocked_websites (url, start_time, end_time, selected_days, status)
            VALUES (?, ?, ?, ?, ?)''', (data['url'], data['start_time'], data['end_time'], selected_days, 1))
        connection.commit()
        connection.close()
        return jsonify({"message": "Website blocked successfully"}), 201
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


@app.route('/history', methods=['GET'])
def get_history():
    """Updates History Page"""
    try:
        connection = sqlite3.connect('timesink.db')
        cursor = connection.cursor()
        cursor.execute('SELECT * FROM blocked_websites ORDER BY id DESC')
        websites = cursor.fetchall()
        connection.close()
        return jsonify([{
            'id': website[0],
            'url': website[1],
            'start_time': website[2],
            'end_time': website[3],
            'selected_days': website[4].split(','),
            'status': website[5]
        } for website in websites]), 200
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


@app.route('/current_block', methods=['GET'])
def get_website():
    """List all of the currently blocked websites"""
    try:
        connection = sqlite3.connect('timesink.db')
        cursor = connection.cursor()
        cursor.execute('SELECT * FROM blocked_websites WHERE status = 1')
        websites = cursor.fetchall()
        connection.close()
        if not websites:
            return jsonify({"message": "No currently blocked websites."}), 404
        return jsonify([{
            'id': website[0],
            'url': website[1],
            'start_time': website[2],
            'end_time': website[3],
            'selected_days': website[4],
            'status': website[5]
        } for website in websites]), 200
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


@app.route('/current_block/<int:id>', methods=['PUT'])
def update_website(id):
    """Update the details of a blocked website"""
    data = request.json
    if not data.get('start_time') or not data.get('end_time') or not data.get('selected_days'):
        return jsonify({"error": "Missing required fields"}), 400
    try:
        connection = sqlite3.connect('timesink.db')
        cursor = connection.cursor()
        cursor.execute('''UPDATE blocked_websites SET start_time = ?, end_time = ?, selected_days = ?
                          WHERE id = ?''', (data['start_time'], data['end_time'], data['selected_days'], id))
        connection.commit()
        connection.close()
        return jsonify({"message": "Website updated successfully"}), 200
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


@app.route('/current_block/<int:id>', methods=['DELETE'])
def delete_website(id):
    """Delete a blocked website"""
    try:
        connection = sqlite3.connect('timesink.db')
        cursor = connection.cursor()
        cursor.execute('''DELETE FROM blocked_websites WHERE id = ?''', (id,))
        connection.commit()
        connection.close()
        return jsonify({"message": "Website deleted successfully"}), 200
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


@app.route('/reblock', methods=['POST'])
def reblock_website():
    """Re-block a website that has been unblocked"""
    data = request.json
    conn = sqlite3.connect('timesink.db')
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE blocked_websites
        SET status = '1'
        WHERE id = ?
    ''', (data['id'],))
    conn.commit()
    conn.close()
    return jsonify({"message": "Website re-blocked successfully"}), 200


# New Routes for Statistics.js
# Distinct clients on the network
@app.route('/clients', methods=['GET'])
def get_clients():
    """Fetch the list of unique clients from the dns_log table"""
    try:
        # open the connection to the database
        conn = sqlite3.connect('dns_log.db')
        cursor = conn.cursor()

        # grab client data from the database
        cursor.execute("SELECT DISTINCT query_client FROM dns_log ORDER by query_client DESC")
        clients = [row[0] for row in cursor.fetchall()]

        # close the connection
        conn.close()
        return jsonify({'clients': clients}), 200

    # error handling
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


# Queries by date
@app.route('/queries_by_date', methods=['GET'])
def get_queries_by_date():
    """Fetch paginated query data based on the selected client and date range"""
    try:
        # sort out the parameters
        query_type_pattern = '%query%'  # Search only for queries with query in the type
        query_date = str(request.args.get('date'))  # Date from front end
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

    # error handling
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


@app.route('/top_queries', methods=['GET'])
def get_top_queries():
    """Fetch the top queries for a specific client over a specified number of days"""
    try:
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
            "queries": [{"domain": row[0], "count": row[1]} for row in top_queries]
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
            "queries": [{"domain": row[0], "count": row[1]} for row in top_blocked]
        }
        # close the connection
        conn.close()

        return jsonify(results), 200

    # error handling
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


def run_scheduler():
    while True:
        update_cron_jobs()
        time.sleep(20)  # Sleep for 5 minutes


# Start background thread
threading.Thread(target=run_scheduler, daemon=True).start()


if __name__ == '__main__':
    init_db()

    app.run(debug=True)
