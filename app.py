from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import logging

app = Flask(__name__)
CORS(app)

# Initialize the SQLite database
def init_db():
    conn = sqlite3.connect('blocked_websites.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS blocked_websites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            selected_days TEXT NOT NULL,
            status TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# Set up logging
logging.basicConfig(filename='app.log', level=logging.INFO, format='%(asctime)s %(message)s')

@app.route('/block', methods=['POST'])
def block_website():
    """Successfully added blocked website"""
    data = request.json
    selected_days = ','.join([day for day, selected in data['selectedDays'].items() if selected])
    
    print(f"Storing selected_days: {selected_days}")  # Debug print
    
    conn = sqlite3.connect('blocked_websites.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO blocked_websites (url, start_time, end_time, selected_days, status)
        VALUES (?, ?, ?, ?, ?)
    ''', (data['url'], data['startTime'], data['endTime'], selected_days, 'blocked'))
    conn.commit()
    conn.close()
    
    # Log the submission
    logging.info(f"Blocked website: {data['url']} from {data['startTime']} to {data['endTime']} on {selected_days}")
    
    # Send a notification (for simplicity, we'll just print a message)
    print(f"Notification: Blocked website {data['url']} from {data['startTime']} to {data['endTime']} on {selected_days}")
    
    return jsonify({"message": "Website blocked successfully"}), 201

@app.route('/reblock', methods=['POST'])
def reblock_website():
    """Re-block a website that has been unblocked"""
    data = request.json
    conn = sqlite3.connect('blocked_websites.db')
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE blocked_websites
        SET status = 'blocked'
        WHERE id = ?
    ''', (data['id'],))
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Website re-blocked successfully"}), 200

@app.route('/unblock', methods=['POST'])
def unblock_website():
    """Unblock a website"""
    data = request.json
    conn = sqlite3.connect('blocked_websites.db')
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE blocked_websites
        SET status = 'unblocked'
        WHERE id = ?
    ''', (data['id'],))
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Website unblocked successfully"}), 200

@app.route('/history', methods=['GET'])
def get_history():
    """Updates History Page"""
    conn = sqlite3.connect('blocked_websites.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id, url, start_time, end_time, selected_days, status FROM blocked_websites ORDER BY id')
    rows = cursor.fetchall()
    conn.close()
    
    history = [
        {
            'id': row[0],
            'url': row[1],
            'startTime': row[2],
            'endTime': row[3],
            'selectedDays': row[4].split(','),
            'status': row[5]
        }
    for row in rows]
    
    print(f"Retrieved history: {history}")  # Debug print
    
    return jsonify(history), 200

if __name__ == '__main__':
    app.run(debug=True)