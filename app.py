from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

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
            status INTEGER NOT NULL)'''
        )
        connection.commit()
        connection.close()
    except sqlite3.Error as e:
        print(f"Database initialization failed: {e}")
        raise

@app.route('/block', methods=['POST'])
def block_website():
    """Successfully added blocked website"""
    data = request.json
    if not data.get('url') or not data.get('start_time') or not data.get('end_time') or not data.get('selected_days') or not data.get('status'):
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        connection = sqlite3.connect('timesink.db')
        cursor = connection.cursor()
        cursor.execute('''INSERT INTO blocked_websites (url, start_time, end_time, selected_days, status) 
                          VALUES (?, ?, ?, ?, ?)''',
                       (data['url'], data['start_time'], data['end_time'], data['selected_days'], data['status']))
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
        cursor.execute('SELECT * FROM blocked_websites')
        websites = cursor.fetchall()
        connection.close()
        
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
    

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
