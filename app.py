from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# In-memory data store for blocked websites
blocked_websites = []

@app.route('/block', methods=['POST'])
def block_website():
    data = request.json
    blocked_websites.append(data)
    return jsonify({"message": "Website blocked successfully"}), 201

@app.route('/history', methods=['GET'])
def get_history():
    return jsonify(blocked_websites), 200

if __name__ == '__main__':
    app.run(debug=True)