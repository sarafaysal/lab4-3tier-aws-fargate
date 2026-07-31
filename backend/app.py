from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import mysql.connector
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Fetch database environment variables set by Docker
DB_HOST = os.environ.get('DB_HOST', 'db')
DB_NAME = os.environ.get('DB_NAME', 'appdb')
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'pass123')

def get_db_connection():
    """Helper function to manage MySQL database connections."""
    return mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )

@app.route('/insert', methods=['POST'])
def insert_data():
    data = request.get_json()
    text_input = data.get('text') if data else None

    if not text_input:
        return jsonify({"error": "No text provided"}), 400

    now = datetime.now()

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO entries (text_input, created_at) VALUES (%s, %s)",
        (text_input, now)
    )
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "Inserted successfully", "time": str(now)}), 200

@app.route('/entries', methods=['GET'])
def get_entries():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, text_input, created_at FROM entries ORDER BY id DESC")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    result = [{"id": r[0], "text": r[1], "created_at": str(r[2])} for r in rows]
    return jsonify(result), 200

@app.route('/entries', methods=['DELETE'])
def clear_entries():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM entries")
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "All entries cleared"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
